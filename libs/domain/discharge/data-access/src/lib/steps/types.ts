/**
 * Step Types
 *
 * Shared type definitions for discharge step handlers.
 */

import type { ExecutionPlan } from "@odis-ai/domain/shared";
import type { ICasesService } from "@odis-ai/domain/shared";
import type { OrchestrationRequest } from "@odis-ai/shared/validators/orchestration";
import type { StepName, StepResult } from "@odis-ai/shared/types/orchestration";
import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Context passed to each step handler
 */
export interface StepContext {
  supabase: SupabaseClientType;
  user: User;
  casesService: ICasesService;
  plan: ExecutionPlan;
  results: Map<StepName, StepResult>;
  request: OrchestrationRequest;
}
