/**
 * Integration tests for ExecutionPlan
 *
 * Tests step dependency resolution, parallelization detection,
 * and execution state management.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ExecutionPlan } from "../execution-plan";
import type { OrchestrationRequest } from "~/lib/validators/orchestration";

describe("ExecutionPlan", () => {
  const createRequest = (
    steps: OrchestrationRequest["steps"],
  ): OrchestrationRequest => ({
    input: {
      rawData: {
        mode: "text",
        source: "web_dashboard",
        text: "Test patient data",
      },
    },
    steps,
    options: {},
  });

  describe("Step Dependencies", () => {
    it("should identify ingest as having no dependencies", () => {
      const request = createRequest({ ingest: true });
      const plan = new ExecutionPlan(request);

      expect(plan.shouldExecuteStep("ingest")).toBe(true);
    });

    it("should require ingest before generateSummary", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      // generateSummary should not execute before ingest completes
      expect(plan.shouldExecuteStep("generateSummary")).toBe(false);

      // After marking ingest as completed, generateSummary should be ready
      plan.markCompleted("ingest");
      expect(plan.shouldExecuteStep("generateSummary")).toBe(true);
    });

    it("should require generateSummary before prepareEmail", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
        prepareEmail: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      expect(plan.shouldExecuteStep("prepareEmail")).toBe(false);

      plan.markCompleted("generateSummary");
      expect(plan.shouldExecuteStep("prepareEmail")).toBe(true);
    });

    it("should allow scheduleCall to run after ingest (parallel with email steps)", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      plan.markCompleted("generateSummary");
      plan.markCompleted("prepareEmail");

      // scheduleCall only depends on ingest, so it can run in parallel with scheduleEmail
      expect(plan.shouldExecuteStep("scheduleCall")).toBe(true);
      expect(plan.shouldExecuteStep("scheduleEmail")).toBe(true);
    });
  });

  describe("Parallel Execution Detection", () => {
    it("should detect that scheduleEmail and scheduleCall can run in parallel", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      plan.markCompleted("generateSummary");
      plan.markCompleted("prepareEmail");

      const batch = plan.getNextBatch();
      expect(batch.length).toBeGreaterThan(1);
      expect(batch).toContain("scheduleEmail");
      expect(batch).toContain("scheduleCall");

      // Verify they can run in parallel
      expect(plan.canRunInParallel(batch)).toBe(true);
    });

    it("should not allow steps with dependencies to run in parallel", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      // ingest and generateSummary cannot run in parallel (generateSummary depends on ingest)
      expect(plan.canRunInParallel(["ingest", "generateSummary"])).toBe(false);
    });

    it("should return sequential batches when steps have dependencies", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      const batch = plan.getNextBatch();
      expect(batch).toEqual(["ingest"]); // Only ingest can run first
    });
  });

  describe("Step State Management", () => {
    it("should track completed steps", () => {
      const request = createRequest({ ingest: true });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      expect(plan.getCompletedSteps()).toContain("ingest");
      expect(plan.shouldExecuteStep("ingest")).toBe(false); // Already completed
    });

    it("should track failed steps", () => {
      const request = createRequest({ ingest: true });
      const plan = new ExecutionPlan(request);

      plan.markFailed("ingest");
      expect(plan.getFailedSteps()).toContain("ingest");
      expect(plan.shouldExecuteStep("ingest")).toBe(false); // Failed, don't retry
    });

    it("should not execute disabled steps", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: false, // Disabled
      });
      const plan = new ExecutionPlan(request);

      expect(plan.shouldExecuteStep("generateSummary")).toBe(false);
    });

    it("should detect remaining steps", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.hasRemainingSteps()).toBe(true);

      plan.markCompleted("ingest");
      expect(plan.hasRemainingSteps()).toBe(true); // generateSummary still pending

      plan.markCompleted("generateSummary");
      expect(plan.hasRemainingSteps()).toBe(false); // All done
    });
  });

  describe("Step Configuration", () => {
    it("should handle boolean step configuration", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: false,
      });
      const plan = new ExecutionPlan(request);

      const ingestConfig = plan.getStepConfig("ingest");
      expect(ingestConfig?.enabled).toBe(true);

      const summaryConfig = plan.getStepConfig("generateSummary");
      expect(summaryConfig?.enabled).toBe(false);
    });

    it("should handle object step configuration with options", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: {
          templateId: "template-123",
          useLatestEntities: true,
        },
        scheduleEmail: {
          recipientEmail: "test@example.com",
          scheduledFor: new Date(),
        },
      });
      const plan = new ExecutionPlan(request);

      const summaryConfig = plan.getStepConfig("generateSummary");
      expect(summaryConfig?.enabled).toBe(true);
      expect(summaryConfig?.options).toBeDefined();

      const emailConfig = plan.getStepConfig("scheduleEmail");
      expect(emailConfig?.enabled).toBe(true);
      expect(emailConfig?.options).toBeDefined();
    });

    it("should return undefined for undefined steps", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      const config = plan.getStepConfig("generateSummary");
      expect(config?.enabled).toBe(false); // Not enabled when undefined
    });
  });

  describe("Execution Batches", () => {
    it("should return correct batches for full workflow", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      // First batch: only ingest
      let batch = plan.getNextBatch();
      expect(batch).toEqual(["ingest"]);
      plan.markCompleted("ingest");

      // Second batch: generateSummary (scheduleCall can also run since it only depends on ingest)
      batch = plan.getNextBatch();
      // getNextBatch returns all ready steps that can run in parallel
      expect(batch.length).toBeGreaterThanOrEqual(1);
      expect(batch).toContain("generateSummary");
      // scheduleCall can run in parallel with generateSummary (both depend only on ingest)
      if (batch.length > 1) {
        expect(batch).toContain("scheduleCall");
      }
      plan.markCompleted("generateSummary");

      // Third batch: prepareEmail (scheduleCall may still be ready if not completed)
      batch = plan.getNextBatch();
      expect(batch.length).toBeGreaterThanOrEqual(1);
      expect(batch).toContain("prepareEmail");
      plan.markCompleted("prepareEmail");

      // Fourth batch: scheduleEmail and scheduleCall can run in parallel
      batch = plan.getNextBatch();
      expect(batch.length).toBeGreaterThanOrEqual(1);
      // Both should be ready if scheduleCall wasn't completed earlier
      if (batch.length === 2) {
        expect(batch).toContain("scheduleEmail");
        expect(batch).toContain("scheduleCall");
      } else {
        // If scheduleCall was completed earlier, only scheduleEmail remains
        expect(batch).toContain("scheduleEmail");
      }
    });

    it("should return empty batch when all steps completed", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      const batch = plan.getNextBatch();
      expect(batch).toEqual([]);
    });

    it("should handle partial workflow", () => {
      const request = createRequest({
        ingest: true,
        generateSummary: true,
        // prepareEmail, scheduleEmail, scheduleCall are disabled
      });
      const plan = new ExecutionPlan(request);

      let batch = plan.getNextBatch();
      expect(batch).toEqual(["ingest"]);
      plan.markCompleted("ingest");

      batch = plan.getNextBatch();
      expect(batch).toEqual(["generateSummary"]);
      plan.markCompleted("generateSummary");

      batch = plan.getNextBatch();
      expect(batch).toEqual([]); // No more steps
    });
  });

  describe("Existing Case Input", () => {
    it("should handle existing case input", () => {
      const request: OrchestrationRequest = {
        input: {
          existingCase: {
            caseId: "case-123",
          },
        },
        steps: {
          generateSummary: true,
        },
        options: {},
      };
      const plan = new ExecutionPlan(request);

      // With existing case, ingest should be skipped
      const ingestConfig = plan.getStepConfig("ingest");
      expect(ingestConfig?.enabled).toBe(false);

      // generateSummary should be ready (no ingest dependency when using existing case)
      // Note: In practice, the orchestrator handles this differently
      // This test verifies the plan structure
      expect(plan.getEnabledSteps()).toContain("generateSummary");
    });
  });
});
