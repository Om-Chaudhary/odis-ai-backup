/**
 * Tests for ExecutionPlan class
 * - Plan building and step configuration
 * - Execution control (shouldExecuteStep, canRunInParallel, getNextBatch)
 * - State management (markCompleted, markFailed, hasRemainingSteps)
 */

import { describe, it, expect } from "vitest";
import { ExecutionPlan } from "../lib/execution-plan";
import type { OrchestrationRequest } from "@odis-ai/shared/validators/orchestration";

/* ========================================
   Test Helpers
   ======================================== */

/**
 * Create a minimal valid OrchestrationRequest for testing
 */
function createRequest(
  steps: OrchestrationRequest["steps"],
): OrchestrationRequest {
  return {
    input: {
      existingCase: {
        caseId: "00000000-0000-0000-0000-000000000001",
      },
    },
    steps,
  };
}

/* ========================================
   Plan Building Tests
   ======================================== */

describe("ExecutionPlan", () => {
  describe("plan building", () => {
    it("creates a plan with enabled steps (boolean true)", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.getEnabledSteps()).toContain("ingest");
      expect(plan.getEnabledSteps()).toContain("extractEntities");
    });

    it("creates a plan with disabled steps (boolean false)", () => {
      const request = createRequest({
        ingest: false,
        extractEntities: false,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.getEnabledSteps()).not.toContain("ingest");
      expect(plan.getEnabledSteps()).not.toContain("extractEntities");
    });

    it("enables steps with object configuration", () => {
      const request = createRequest({
        ingest: { options: { skipDuplicateCheck: true } },
        generateSummary: { templateId: "00000000-0000-0000-0000-000000000002" },
      });
      const plan = new ExecutionPlan(request);

      expect(plan.getEnabledSteps()).toContain("ingest");
      expect(plan.getEnabledSteps()).toContain("generateSummary");
    });

    it("treats undefined steps as disabled", () => {
      const request = createRequest({
        ingest: true,
        // extractEntities is undefined
      });
      const plan = new ExecutionPlan(request);

      expect(plan.getEnabledSteps()).toContain("ingest");
      expect(plan.getEnabledSteps()).not.toContain("extractEntities");
    });

    it("stores step options correctly", () => {
      const request = createRequest({
        scheduleEmail: {
          recipientEmail: "test@example.com",
          scheduledFor: new Date("2024-12-15T10:00:00Z"),
        },
      });
      const plan = new ExecutionPlan(request);

      const config = plan.getStepConfig("scheduleEmail");
      expect(config?.enabled).toBe(true);
      expect(config?.options).toEqual({
        recipientEmail: "test@example.com",
        scheduledFor: expect.any(Date),
      });
    });

    it("sets correct dependencies for each step", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      // ingest has no dependencies
      expect(plan.getStepConfig("ingest")?.dependencies).toEqual([]);

      // extractEntities depends on ingest
      expect(plan.getStepConfig("extractEntities")?.dependencies).toEqual([
        "ingest",
      ]);

      // generateSummary depends on ingest and extractEntities
      expect(plan.getStepConfig("generateSummary")?.dependencies).toEqual([
        "ingest",
        "extractEntities",
      ]);

      // prepareEmail depends on generateSummary
      expect(plan.getStepConfig("prepareEmail")?.dependencies).toEqual([
        "generateSummary",
      ]);

      // scheduleEmail depends on prepareEmail
      expect(plan.getStepConfig("scheduleEmail")?.dependencies).toEqual([
        "prepareEmail",
      ]);

      // scheduleCall depends on ingest and extractEntities
      expect(plan.getStepConfig("scheduleCall")?.dependencies).toEqual([
        "ingest",
        "extractEntities",
      ]);
    });
  });

  /* ========================================
     shouldExecuteStep Tests
     ======================================== */

  describe("shouldExecuteStep", () => {
    it("returns false for disabled step", () => {
      const request = createRequest({
        ingest: false,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.shouldExecuteStep("ingest")).toBe(false);
    });

    it("returns true for enabled step with no dependencies", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.shouldExecuteStep("ingest")).toBe(true);
    });

    it("returns false when dependencies are not met", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      // extractEntities depends on ingest, which hasn't completed
      expect(plan.shouldExecuteStep("extractEntities")).toBe(false);
    });

    it("returns true when dependencies are met", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      expect(plan.shouldExecuteStep("extractEntities")).toBe(true);
    });

    it("returns false for already completed step", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      expect(plan.shouldExecuteStep("ingest")).toBe(false);
    });

    it("returns false for already failed step", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markFailed("ingest");
      expect(plan.shouldExecuteStep("ingest")).toBe(false);
    });

    it("returns false for step with multiple unmet dependencies", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      // Only ingest completed, extractEntities still pending
      plan.markCompleted("ingest");
      expect(plan.shouldExecuteStep("generateSummary")).toBe(false);
    });

    it("returns true when all multiple dependencies are met", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      plan.markCompleted("extractEntities");
      expect(plan.shouldExecuteStep("generateSummary")).toBe(true);
    });
  });

  /* ========================================
     canRunInParallel Tests
     ======================================== */

  describe("canRunInParallel", () => {
    it("returns true for steps without interdependencies", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      // prepareEmail and scheduleCall don't depend on each other
      expect(plan.canRunInParallel(["prepareEmail", "scheduleCall"])).toBe(
        true,
      );
    });

    it("returns false for steps with interdependencies", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      // extractEntities depends on ingest
      expect(plan.canRunInParallel(["ingest", "extractEntities"])).toBe(false);
    });

    it("returns false for steps in sequential chain", () => {
      const request = createRequest({
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
      });
      const plan = new ExecutionPlan(request);

      expect(
        plan.canRunInParallel([
          "generateSummary",
          "prepareEmail",
          "scheduleEmail",
        ]),
      ).toBe(false);
    });

    it("returns true for single step", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.canRunInParallel(["ingest"])).toBe(true);
    });

    it("returns false if any step is not in plan", () => {
      const request = createRequest({
        ingest: true,
      });
      const plan = new ExecutionPlan(request);

      // Type assertion needed for test with invalid step name
      expect(plan.canRunInParallel(["ingest", "nonexistent" as "ingest"])).toBe(
        false,
      );
    });
  });

  /* ========================================
     getNextBatch Tests
     ======================================== */

  describe("getNextBatch", () => {
    it("returns first enabled step with no dependencies initially", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      expect(plan.getNextBatch()).toEqual(["ingest"]);
    });

    it("returns empty array when no steps enabled", () => {
      const request = createRequest({});
      const plan = new ExecutionPlan(request);

      expect(plan.getNextBatch()).toEqual([]);
    });

    it("returns next step after completing dependency", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      expect(plan.getNextBatch()).toEqual(["extractEntities"]);
    });

    it("returns parallel steps when dependencies allow", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      // Complete ingest, extractEntities, and generateSummary
      plan.markCompleted("ingest");
      plan.markCompleted("extractEntities");
      plan.markCompleted("generateSummary");

      // Now prepareEmail and scheduleCall can both run
      const batch = plan.getNextBatch();
      expect(batch).toContain("prepareEmail");
      expect(batch).toContain("scheduleCall");
      expect(batch).toHaveLength(2);
    });

    it("returns empty array when all steps completed", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      plan.markCompleted("extractEntities");

      expect(plan.getNextBatch()).toEqual([]);
    });

    it("returns empty array when remaining steps are blocked by failed dependency", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markFailed("ingest");

      // extractEntities depends on ingest which failed
      expect(plan.getNextBatch()).toEqual([]);
    });

    it("handles mixed completed and failed steps", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      plan.markCompleted("extractEntities");
      plan.markFailed("generateSummary");

      // scheduleCall can still run (depends on ingest and extractEntities)
      // prepareEmail cannot (depends on generateSummary which failed)
      const batch = plan.getNextBatch();
      expect(batch).toEqual(["scheduleCall"]);
    });
  });

  /* ========================================
     State Management Tests
     ======================================== */

  describe("state management", () => {
    describe("markCompleted", () => {
      it("adds step to completed set", () => {
        const request = createRequest({
          ingest: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markCompleted("ingest");
        expect(plan.getCompletedSteps()).toContain("ingest");
      });

      it("allows multiple steps to be marked completed", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markCompleted("ingest");
        plan.markCompleted("extractEntities");

        const completed = plan.getCompletedSteps();
        expect(completed).toContain("ingest");
        expect(completed).toContain("extractEntities");
        expect(completed).toHaveLength(2);
      });
    });

    describe("markFailed", () => {
      it("adds step to failed set", () => {
        const request = createRequest({
          ingest: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markFailed("ingest");
        expect(plan.getFailedSteps()).toContain("ingest");
      });

      it("allows multiple steps to be marked failed", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markFailed("ingest");
        plan.markFailed("extractEntities");

        const failed = plan.getFailedSteps();
        expect(failed).toContain("ingest");
        expect(failed).toContain("extractEntities");
        expect(failed).toHaveLength(2);
      });
    });

    describe("hasRemainingSteps", () => {
      it("returns true when steps remain", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: true,
        });
        const plan = new ExecutionPlan(request);

        expect(plan.hasRemainingSteps()).toBe(true);
      });

      it("returns true when some steps completed but others remain", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markCompleted("ingest");
        expect(plan.hasRemainingSteps()).toBe(true);
      });

      it("returns false when all enabled steps completed", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markCompleted("ingest");
        plan.markCompleted("extractEntities");
        expect(plan.hasRemainingSteps()).toBe(false);
      });

      it("returns false when all enabled steps failed", () => {
        const request = createRequest({
          ingest: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markFailed("ingest");
        expect(plan.hasRemainingSteps()).toBe(false);
      });

      it("returns false when steps are mix of completed and failed", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: true,
        });
        const plan = new ExecutionPlan(request);

        plan.markCompleted("ingest");
        plan.markFailed("extractEntities");
        expect(plan.hasRemainingSteps()).toBe(false);
      });

      it("returns false when no steps enabled", () => {
        const request = createRequest({});
        const plan = new ExecutionPlan(request);

        expect(plan.hasRemainingSteps()).toBe(false);
      });
    });

    describe("getStepConfig", () => {
      it("returns config for existing step", () => {
        const request = createRequest({
          ingest: true,
        });
        const plan = new ExecutionPlan(request);

        const config = plan.getStepConfig("ingest");
        expect(config).toBeDefined();
        expect(config?.name).toBe("ingest");
        expect(config?.enabled).toBe(true);
        expect(config?.dependencies).toEqual([]);
      });

      it("returns config for disabled step", () => {
        const request = createRequest({
          ingest: false,
        });
        const plan = new ExecutionPlan(request);

        const config = plan.getStepConfig("ingest");
        expect(config).toBeDefined();
        expect(config?.enabled).toBe(false);
      });
    });

    describe("getEnabledSteps", () => {
      it("returns only enabled steps", () => {
        const request = createRequest({
          ingest: true,
          extractEntities: false,
          generateSummary: true,
        });
        const plan = new ExecutionPlan(request);

        const enabled = plan.getEnabledSteps();
        expect(enabled).toContain("ingest");
        expect(enabled).toContain("generateSummary");
        expect(enabled).not.toContain("extractEntities");
      });

      it("returns empty array when no steps enabled", () => {
        const request = createRequest({});
        const plan = new ExecutionPlan(request);

        expect(plan.getEnabledSteps()).toEqual([]);
      });
    });

    describe("getCompletedSteps", () => {
      it("returns empty array initially", () => {
        const request = createRequest({
          ingest: true,
        });
        const plan = new ExecutionPlan(request);

        expect(plan.getCompletedSteps()).toEqual([]);
      });
    });

    describe("getFailedSteps", () => {
      it("returns empty array initially", () => {
        const request = createRequest({
          ingest: true,
        });
        const plan = new ExecutionPlan(request);

        expect(plan.getFailedSteps()).toEqual([]);
      });
    });
  });

  /* ========================================
     Integration Tests
     ======================================== */

  describe("full workflow simulation", () => {
    it("executes simple sequential workflow", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      // Step 1: ingest
      expect(plan.getNextBatch()).toEqual(["ingest"]);
      plan.markCompleted("ingest");

      // Step 2: extractEntities
      expect(plan.getNextBatch()).toEqual(["extractEntities"]);
      plan.markCompleted("extractEntities");

      // Step 3: generateSummary
      expect(plan.getNextBatch()).toEqual(["generateSummary"]);
      plan.markCompleted("generateSummary");

      // Done
      expect(plan.getNextBatch()).toEqual([]);
      expect(plan.hasRemainingSteps()).toBe(false);
    });

    it("executes workflow with parallelization", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      // Step 1: ingest (only option)
      expect(plan.getNextBatch()).toEqual(["ingest"]);
      plan.markCompleted("ingest");

      // Step 2: extractEntities (depends on ingest)
      expect(plan.getNextBatch()).toEqual(["extractEntities"]);
      plan.markCompleted("extractEntities");

      // Step 3: generateSummary and scheduleCall ready
      let batch = plan.getNextBatch();
      expect(batch).toContain("generateSummary");
      expect(batch).toContain("scheduleCall");
      plan.markCompleted("generateSummary");
      plan.markCompleted("scheduleCall");

      // Step 4: prepareEmail (depends on generateSummary)
      expect(plan.getNextBatch()).toEqual(["prepareEmail"]);
      plan.markCompleted("prepareEmail");

      // Step 5: scheduleEmail (depends on prepareEmail)
      expect(plan.getNextBatch()).toEqual(["scheduleEmail"]);
      plan.markCompleted("scheduleEmail");

      // Done
      expect(plan.getNextBatch()).toEqual([]);
      expect(plan.hasRemainingSteps()).toBe(false);
      expect(plan.getCompletedSteps()).toHaveLength(6);
    });

    it("handles failure gracefully", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
      });
      const plan = new ExecutionPlan(request);

      // ingest succeeds
      plan.markCompleted("ingest");

      // extractEntities fails
      plan.markFailed("extractEntities");

      // generateSummary depends on extractEntities, so can't proceed
      expect(plan.shouldExecuteStep("generateSummary")).toBe(false);
      expect(plan.getNextBatch()).toEqual([]);

      // But we still have remaining enabled step (generateSummary)
      // that can't run due to failed dependency
      expect(plan.hasRemainingSteps()).toBe(true);
    });

    it("allows call to proceed when email fails", () => {
      const request = createRequest({
        ingest: true,
        extractEntities: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleCall: true,
      });
      const plan = new ExecutionPlan(request);

      plan.markCompleted("ingest");
      plan.markCompleted("extractEntities");
      plan.markFailed("generateSummary"); // This breaks email path

      // scheduleCall should still be executable
      expect(plan.shouldExecuteStep("scheduleCall")).toBe(true);
      expect(plan.getNextBatch()).toEqual(["scheduleCall"]);

      // prepareEmail cannot run (depends on failed generateSummary)
      expect(plan.shouldExecuteStep("prepareEmail")).toBe(false);
    });
  });
});
