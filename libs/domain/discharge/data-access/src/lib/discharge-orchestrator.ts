/**
 * Discharge Orchestrator Service
 *
 * Orchestrates the execution of discharge workflow steps including:
 * - Data ingestion
 * - Summary generation
 * - Email preparation and scheduling
 * - Call scheduling
 *
 * Supports both sequential and parallel execution modes.
 */

import { ExecutionPlan } from "@odis-ai/domain/shared";
import type { ICasesService } from "@odis-ai/domain/shared";
import type { OrchestrationRequest } from "@odis-ai/shared/validators/orchestration";
import type {
  CallResult,
  EmailResult,
  EmailScheduleResult,
  IngestResult,
  OrchestrationResult,
  StepName,
  StepResult,
  SummaryResult,
  ExtractEntitiesResult,
} from "@odis-ai/shared/types/orchestration";
import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { User } from "@supabase/supabase-js";

// Import step handlers
import {
  executeIngestion,
  executeEntityExtraction,
  executeSummaryGeneration,
  executeEmailPreparation,
  executeEmailScheduling,
  executeCallScheduling,
  type StepContext,
} from "./discharge-steps";
import { getTypedResult } from "./discharge-helpers";

/**
 * Step execution order for sequential processing
 */
const STEP_ORDER: readonly StepName[] = [
  "ingest",
  "extractEntities",
  "generateSummary",
  "prepareEmail",
  "scheduleEmail",
  "scheduleCall",
] as const;

/**
 * Discharge Orchestrator Class
 */
export class DischargeOrchestrator {
  private plan!: ExecutionPlan;
  private results = new Map<StepName, StepResult>();
  private request!: OrchestrationRequest;

  constructor(
    private supabase: SupabaseClientType,
    private user: User,
    private casesService: ICasesService,
  ) {}

  /**
   * Main orchestration method
   */
  async orchestrate(
    request: OrchestrationRequest,
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.request = request;
    this.plan = new ExecutionPlan(request);
    this.results.clear();

    try {
      if (request.options?.parallel ?? true) {
        await this.executeParallel();
      } else {
        await this.executeSequential();
      }

      return this.buildResult(startTime);
    } catch (error) {
      return this.buildErrorResult(error, startTime);
    }
  }

  /**
   * Get step context for handlers
   */
  private getStepContext(): StepContext {
    return {
      supabase: this.supabase,
      user: this.user,
      casesService: this.casesService,
      plan: this.plan,
      results: this.results,
      request: this.request,
    };
  }

  /**
   * Execute steps sequentially
   */
  private async executeSequential(): Promise<void> {
    // Handle existing case: mark ingest as completed if not explicitly enabled
    if (this.request.input && "existingCase" in this.request.input) {
      if (!this.results.has("ingest")) {
        const stepStart = Date.now();
        const result = await this.executeStep("ingest");
        this.results.set("ingest", result);
        if (result.status === "completed") {
          this.plan.markCompleted("ingest");
        }
      }

      // Handle existing case with emailContent
      if (this.request.input.existingCase.emailContent) {
        const stepConfig = this.plan.getStepConfig("prepareEmail");
        if (stepConfig?.enabled && !this.results.has("prepareEmail")) {
          const result = await this.executeStep("prepareEmail");
          this.results.set("prepareEmail", result);
          if (result.status === "completed") {
            this.plan.markCompleted("prepareEmail");
            if (!this.plan.getCompletedSteps().includes("generateSummary")) {
              this.plan.markCompleted("generateSummary");
            }
          }
        }
      }
    }

    for (const step of STEP_ORDER) {
      if (!this.plan.shouldExecuteStep(step)) {
        const stepConfig = this.plan.getStepConfig(step);
        if (stepConfig?.enabled) {
          const hasFailedDependency = stepConfig.dependencies.some(
            (dep: StepName) => this.plan.getFailedSteps().includes(dep),
          );
          if (hasFailedDependency) {
            this.results.set(step, {
              step,
              status: "skipped",
              duration: 0,
              error: "Dependency failed",
            });
            continue;
          }
        }
        if (!this.results.has(step)) {
          this.results.set(step, { step, status: "skipped", duration: 0 });
        }
        continue;
      }

      const result = await this.executeStep(step);
      this.results.set(step, result);

      if (result.status === "completed") {
        this.plan.markCompleted(step);
      } else if (result.status === "failed") {
        this.plan.markFailed(step);
        this.markDependentStepsAsSkipped(step);
        if (this.request.options?.stopOnError) break;
      }
    }

    // Ensure all steps are tracked
    for (const step of STEP_ORDER) {
      if (!this.results.has(step)) {
        this.results.set(step, { step, status: "skipped", duration: 0 });
      }
    }
  }

  /**
   * Execute steps in parallel where possible
   */
  private async executeParallel(): Promise<void> {
    // Handle existing case
    if (this.request.input && "existingCase" in this.request.input) {
      if (!this.results.has("ingest")) {
        const result = await this.executeStep("ingest");
        this.results.set("ingest", result);
        if (result.status === "completed") {
          this.plan.markCompleted("ingest");
        }
      }

      if (this.request.input.existingCase.emailContent) {
        const stepConfig = this.plan.getStepConfig("prepareEmail");
        if (stepConfig?.enabled && !this.results.has("prepareEmail")) {
          const result = await this.executeStep("prepareEmail");
          this.results.set("prepareEmail", result);
          if (result.status === "completed") {
            this.plan.markCompleted("prepareEmail");
            if (!this.plan.getCompletedSteps().includes("generateSummary")) {
              this.plan.markCompleted("generateSummary");
            }
          }
        }
      }
    }

    while (this.plan.hasRemainingSteps()) {
      const batch = this.plan.getNextBatch();
      if (batch.length === 0) break;

      const promises = batch.map((step: StepName) => this.executeStep(step));
      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach(
        (result: PromiseSettledResult<StepResult>, index: number) => {
          const step = batch[index]!;
          if (result.status === "fulfilled") {
            const stepResult = result.value;
            this.results.set(step, stepResult);
            if (stepResult.status === "completed") {
              this.plan.markCompleted(step);
            } else if (stepResult.status === "failed") {
              this.plan.markFailed(step);
              this.markDependentStepsAsSkipped(step);
            }
          } else {
            this.results.set(step, {
              step,
              status: "failed",
              duration: 0,
              error: result.reason?.message ?? String(result.reason),
            });
            this.plan.markFailed(step);
            this.markDependentStepsAsSkipped(step);
          }
        },
      );

      if (this.request.options?.stopOnError) {
        const hasFailures = batchResults.some(
          (result: PromiseSettledResult<StepResult>) =>
            result.status === "rejected" ||
            (result.status === "fulfilled" && result.value.status === "failed"),
        );
        if (hasFailures) {
          batch.forEach((step: StepName) => {
            if (!this.results.has(step)) {
              this.results.set(step, {
                step,
                status: "skipped",
                duration: 0,
                error: "Cancelled due to previous step failure",
              });
            }
          });
          break;
        }
      }
    }

    // Ensure all steps are tracked
    for (const step of STEP_ORDER) {
      if (!this.results.has(step)) {
        this.results.set(step, { step, status: "skipped", duration: 0 });
      }
    }
  }

  /**
   * Execute a single step - delegates to step handlers
   */
  private async executeStep(step: StepName): Promise<StepResult> {
    const stepStart = Date.now();
    const ctx = this.getStepContext();

    try {
      switch (step) {
        case "ingest":
          return await executeIngestion(ctx, stepStart);
        case "extractEntities":
          return await executeEntityExtraction(ctx, stepStart);
        case "generateSummary":
          return await executeSummaryGeneration(ctx, stepStart);
        case "prepareEmail":
          return await executeEmailPreparation(ctx, stepStart);
        case "scheduleEmail":
          return await executeEmailScheduling(ctx, stepStart);
        case "scheduleCall":
          return await executeCallScheduling(ctx, stepStart);
      }
    } catch (error) {
      return {
        step,
        status: "failed",
        duration: Date.now() - stepStart,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Mark dependent steps as skipped when a step fails
   */
  private markDependentStepsAsSkipped(failedStep: StepName): void {
    for (const step of STEP_ORDER) {
      const stepConfig = this.plan.getStepConfig(step);
      if (!stepConfig?.enabled) continue;
      if (this.results.has(step)) continue;

      if (stepConfig.dependencies.includes(failedStep)) {
        this.results.set(step, {
          step,
          status: "skipped",
          duration: 0,
          error: `Dependency '${failedStep}' failed`,
        });
      }
    }
  }

  /**
   * Build orchestration result
   */
  private buildResult(startTime: number): OrchestrationResult {
    const completedSteps: StepName[] = [];
    const skippedSteps: StepName[] = [];
    const failedSteps: StepName[] = [];
    const stepTimings: Record<string, number> = {};

    for (const [step, result] of this.results.entries()) {
      const timing =
        result.status === "completed" && result.duration === 0
          ? 1
          : result.duration;
      stepTimings[step] = timing;
      if (result.status === "completed") {
        completedSteps.push(step);
      } else if (result.status === "skipped") {
        skippedSteps.push(step);
      } else if (result.status === "failed") {
        failedSteps.push(step);
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    return {
      success: failedSteps.length === 0,
      data: {
        completedSteps,
        skippedSteps,
        failedSteps,
        ingestion: getTypedResult<IngestResult>(this.results, "ingest"),
        extractedEntities: getTypedResult<ExtractEntitiesResult>(
          this.results,
          "extractEntities",
        ),
        summary: getTypedResult<SummaryResult>(this.results, "generateSummary"),
        email: getTypedResult<EmailResult>(this.results, "prepareEmail"),
        emailSchedule: getTypedResult<EmailScheduleResult>(
          this.results,
          "scheduleEmail",
        ),
        call: getTypedResult<CallResult>(this.results, "scheduleCall"),
      },
      metadata: {
        totalProcessingTime: totalProcessingTime > 0 ? totalProcessingTime : 1,
        stepTimings,
        errors: failedSteps.map((step) => ({
          step,
          error: this.results.get(step)?.error ?? "Unknown error",
        })),
      },
    };
  }

  /**
   * Build error result
   */
  private buildErrorResult(
    error: unknown,
    startTime: number,
  ): OrchestrationResult {
    const result = this.buildResult(startTime);
    result.success = false;
    result.metadata.errors = [
      ...(result.metadata.errors ?? []),
      {
        step: "orchestration" as StepName,
        error: error instanceof Error ? error.message : String(error),
      },
    ];
    return result;
  }
}
