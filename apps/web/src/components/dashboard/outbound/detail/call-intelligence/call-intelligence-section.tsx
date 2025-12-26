/**
 * Call Intelligence Section
 *
 * Displays all structured output intelligence cards in a responsive grid
 */

import { Brain } from "lucide-react";
import { CallOutcomeCard } from "./call-outcome-card";
import { PetHealthCard } from "./pet-health-card";
import { MedicationComplianceCard } from "./medication-compliance-card";
import { OwnerSentimentCard } from "./owner-sentiment-card";
import { EscalationCard } from "./escalation-card";
import { FollowUpCard } from "./follow-up-card";

// Types for structured output data - exported for reuse
// Using index signatures for compatibility with various data shapes
export interface CallOutcomeData {
  [key: string]: unknown;
  call_outcome?: string;
  conversation_stage_reached?: string;
  owner_available?: boolean;
  call_duration_appropriate?: boolean;
}

export interface PetHealthData {
  [key: string]: unknown;
  pet_recovery_status?: string;
  symptoms_reported?: string[];
  new_concerns_raised?: boolean;
  condition_resolved?: boolean;
}

export interface MedicationComplianceData {
  [key: string]: unknown;
  medication_discussed?: boolean;
  medication_compliance?: string;
  medication_issues?: string[];
  medication_guidance_provided?: boolean;
}

export interface OwnerSentimentData {
  [key: string]: unknown;
  owner_sentiment?: string;
  owner_engagement_level?: string;
  expressed_gratitude?: boolean;
  expressed_concern_about_care?: boolean;
}

export interface EscalationData {
  [key: string]: unknown;
  escalation_triggered?: boolean;
  escalation_type?: string;
  transfer_attempted?: boolean;
  transfer_successful?: boolean;
  escalation_reason?: string;
}

export interface FollowUpData {
  [key: string]: unknown;
  recheck_reminder_delivered?: boolean;
  recheck_confirmed?: boolean;
  appointment_requested?: boolean;
  follow_up_call_needed?: boolean;
  follow_up_reason?: string;
}

// Accept flexible types for compatibility with various data sources
interface CallIntelligenceSectionProps {
  callOutcomeData: CallOutcomeData | null;
  petHealthData: PetHealthData | null;
  medicationComplianceData: MedicationComplianceData | null;
  ownerSentimentData: OwnerSentimentData | null;
  escalationData: EscalationData | null;
  followUpData: FollowUpData | null;
}

export function CallIntelligenceSection({
  callOutcomeData,
  petHealthData,
  medicationComplianceData,
  ownerSentimentData,
  escalationData,
  followUpData,
}: CallIntelligenceSectionProps) {
  // Check if any intelligence data is available
  const hasAnyData =
    callOutcomeData ??
    petHealthData ??
    medicationComplianceData ??
    ownerSentimentData ??
    escalationData ??
    followUpData;

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
          <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            Call Intelligence
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-extracted insights from the conversation
          </p>
        </div>
      </div>

      {/* Intelligence Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CallOutcomeCard data={callOutcomeData} />
        <PetHealthCard data={petHealthData} />
        <MedicationComplianceCard data={medicationComplianceData} />
        <OwnerSentimentCard data={ownerSentimentData} />
        <EscalationCard data={escalationData} />
        <FollowUpCard data={followUpData} />
      </div>
    </div>
  );
}
