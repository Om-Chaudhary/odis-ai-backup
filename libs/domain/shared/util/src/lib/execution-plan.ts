/**
 * Execution Plan Builder
 *
 * Analyzes orchestration requests and determines step execution order
 * and parallelization opportunities. Tracks step dependencies and state.
 */

import type { OrchestrationRequest } from "@odis-ai/shared/validators/orchestration";
import type { StepName } from "@odis-ai/shared/types/orchestration";

/* ========================================
   Types
   ======================================== */

/**
 * Configuration for a single step in the execution plan
 */
interface StepConfig {
  name: StepName;
  enabled: boolean;
  options?: unknown;
  dependencies: StepName[];
}

/* ========================================
   Execution Plan Class
   ======================================== */

/**
 * ExecutionPlan analyzes orchestration requests and determines:
 * - Step execution order based on dependencies
 * - Parallelization opportunities
 * - Step state (enabled, completed, failed)
 */
export class ExecutionPlan {
  private steps = new Map<StepName, StepConfig>();
  private completedSteps = new Set<StepName>();
  private failedSteps = new Set<StepName>();

  constructor(private request: OrchestrationRequest) {
    this.buildPlan();
  }

  /* ========================================
     Plan Building
     ======================================== */

  /**
   * Build the execution plan from the request
   * Analyzes step configurations and dependencies
   */
  private buildPlan(): void {
    const stepOrder: StepName[] = [
      "ingest",
      "extractEntities",
      "generateSummary",
      "prepareEmail",
      "scheduleEmail",
      "scheduleCall",
    ];

    // Define dependencies for each step
    const dependencies: Record<StepName, StepName[]> = {
      ingest: [],
      extractEntities: ["ingest"],
      generateSummary: ["ingest", "extractEntities"],
      prepareEmail: ["generateSummary"],
      scheduleEmail: ["prepareEmail"],
      scheduleCall: ["ingest", "extractEntities"], // Can run parallel with email steps, but needs entities
    };

    // Process each step
    for (const stepName of stepOrder) {
      const stepConfig = this.request.steps[stepName];

      // Determine if step is enabled
      const enabled = this.isStepEnabled(stepConfig);

      // Get step options
      const options = typeof stepConfig === "object" ? stepConfig : undefined;

      this.steps.set(stepName, {
        name: stepName,
        enabled,
        options,
        dependencies: dependencies[stepName] ?? [],
      });
    }
  }

  /**
   * Determine if a step is enabled based on its configuration
   */
  private isStepEnabled(stepConfig: boolean | object | undefined): boolean {
    if (stepConfig === undefined) return false;
    if (typeof stepConfig === "boolean") return stepConfig;
    return true; // Object means enabled with options
  }

  /* ========================================
     Execution Control
     ======================================== */

  /**
   * Check if a step should execute based on:
   * - Step is enabled
   * - Step hasn't been completed or failed
   * - All dependencies are met
   */
  shouldExecuteStep(stepName: StepName): boolean {
    const config = this.steps.get(stepName);
    if (!config?.enabled) return false;

    // Check if already completed or failed
    if (this.completedSteps.has(stepName)) return false;
    if (this.failedSteps.has(stepName)) return false;

    // Check if dependencies are met
    return config.dependencies.every((dep) => this.completedSteps.has(dep));
  }

  /**
   * Check if multiple steps can run in parallel
   * Steps can run in parallel if they don't depend on each other
   */
  canRunInParallel(steps: StepName[]): boolean {
    // Check if steps have interdependencies
    for (const step of steps) {
      const config = this.steps.get(step);
      if (!config) return false;

      // Check if this step depends on any other step in the list
      const hasDependency = config.dependencies.some((dep) =>
        steps.includes(dep),
      );
      if (hasDependency) return false;
    }

    return true;
  }

  /**
   * Get the next batch of steps that can execute
   * Returns steps that can run in parallel, or a single step if sequential
   */
  getNextBatch(): StepName[] {
    const batch: StepName[] = [];

    // Find all steps that are ready to execute
    const stepOrder: StepName[] = [
      "ingest",
      "extractEntities",
      "generateSummary",
      "prepareEmail",
      "scheduleEmail",
      "scheduleCall",
    ];

    for (const stepName of stepOrder) {
      if (this.shouldExecuteStep(stepName)) {
        batch.push(stepName);
      }
    }

    // If multiple steps are ready, check if they can run in parallel
    if (batch.length > 1 && this.canRunInParallel(batch)) {
      return batch;
    }

    // Otherwise, return first ready step (sequential)
    return batch.length > 0 ? [batch[0]!] : [];
  }

  /* ========================================
     State Management
     ======================================== */

  /**
   * Mark a step as completed
   */
  markCompleted(step: StepName): void {
    this.completedSteps.add(step);
  }

  /**
   * Mark a step as failed
   */
  markFailed(step: StepName): void {
    this.failedSteps.add(step);
  }

  /**
   * Check if there are remaining steps to execute
   */
  hasRemainingSteps(): boolean {
    for (const [stepName, config] of this.steps.entries()) {
      if (config.enabled) {
        if (
          !this.completedSteps.has(stepName) &&
          !this.failedSteps.has(stepName)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get configuration for a specific step
   */
  getStepConfig(stepName: StepName): StepConfig | undefined {
    return this.steps.get(stepName);
  }

  /**
   * Get all enabled steps
   */
  getEnabledSteps(): StepName[] {
    const enabled: StepName[] = [];
    for (const [stepName, config] of this.steps.entries()) {
      if (config.enabled) {
        enabled.push(stepName);
      }
    }
    return enabled;
  }

  /**
   * Get completed steps
   */
  getCompletedSteps(): StepName[] {
    return Array.from(this.completedSteps);
  }

  /**
   * Get failed steps
   */
  getFailedSteps(): StepName[] {
    return Array.from(this.failedSteps);
  }
}
