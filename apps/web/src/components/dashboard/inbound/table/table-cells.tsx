/**
 * Shared table cell components
 */

import { Calendar, Loader2, PawPrint } from "lucide-react";
import { api } from "~/trpc/client";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";
import { formatDuration } from "../../shared/utils";
import { getDemoCallerName, getCallModifications } from "../mock-data";
import type { Database } from "@odis-ai/shared/types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallerDisplayProps {
  /** Original phone from VAPI (may be clinic number) */
  phone: string | null;
  /** Extracted callback phone from transcript/structured data */
  extractedCallerPhone?: string | null;
  /** Extracted caller name from transcript/structured data */
  extractedCallerName?: string | null;
  /** Extracted pet name from transcript/structured data */
  extractedPetName?: string | null;
  /** Clinic's phone number to detect when customer_phone is wrong */
  clinicPhone?: string | null;
  /** Kept for backwards compatibility */
  clinicName?: string | null;
}

/**
 * Displays caller information with phone number as primary
 *
 * Display hierarchy:
 * 1. Phone number (primary, bold) - prioritizes extracted phone over customer_phone
 * 2. Owner name (secondary, muted, smaller) when available
 * 3. Pet name with paw icon (tertiary, muted, smaller) when available
 *
 * Priority for caller info:
 * 1. Extracted data (from transcript/structured data)
 * 2. Demo/mock data (for testing)
 * 3. API lookup by phone
 */
export function CallerDisplay({
  phone,
  extractedCallerPhone,
  extractedCallerName,
  extractedPetName,
  clinicPhone,
  clinicName: _clinicName, // Kept for backwards compatibility
}: CallerDisplayProps) {
  // Determine if customer_phone is actually the clinic's number (common VAPI issue)
  const normalizedPhone = phone?.replace(/\D/g, "");
  const normalizedClinic = clinicPhone?.replace(/\D/g, "");
  const isClinicNumber =
    normalizedPhone && normalizedClinic && normalizedPhone === normalizedClinic;

  // Use extracted phone if available, skip customer_phone if it's the clinic number
  const displayPhone = extractedCallerPhone ?? (isClinicNumber ? null : phone);

  const formattedPhone = formatPhoneNumber(displayPhone ?? "");

  // Check static demo mapping first
  const demoName = getDemoCallerName(phone);

  // Only query for caller info if we don't have extracted data
  const needsApiLookup =
    !extractedCallerName && !extractedPetName && !demoName && !!displayPhone;
  const { data: callerInfo, isLoading } =
    api.inbound.getCallerNameByPhone.useQuery(
      { phone: displayPhone ?? "" },
      {
        enabled: needsApiLookup,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  // Priority: extracted data > demo name > API result
  const callerName =
    extractedCallerName ?? demoName ?? callerInfo?.name ?? null;
  const petName = extractedPetName ?? callerInfo?.petName ?? null;

  // Determine what to show as primary display
  const hasPrimaryPhone = !!formattedPhone;
  const showLoading = isLoading && needsApiLookup;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Primary: Phone or Name */}
      {hasPrimaryPhone ? (
        <span className="text-sm font-semibold">
          {showLoading ? (
            <span className="text-muted-foreground">{formattedPhone}</span>
          ) : (
            formattedPhone
          )}
        </span>
      ) : callerName ? (
        <span className="text-sm font-semibold">{callerName}</span>
      ) : (
        <span className="text-muted-foreground text-sm">Unknown</span>
      )}

      {/* Secondary: Name if we showed phone */}
      {hasPrimaryPhone && callerName && (
        <span className="text-muted-foreground truncate text-xs">
          {callerName}
        </span>
      )}

      {/* Tertiary: Pet name with icon */}
      {petName && (
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <PawPrint className="h-3 w-3" />
          <span className="truncate">{petName}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Call duration display with dynamic fetch from VAPI if needed
 */
export function CallDuration({ call }: { call: InboundCall }) {
  // Check for hardcoded modifications
  const callMods = getCallModifications(call);

  // Silent calls show em dash
  if (callMods.isSilent) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  // Use existing duration if available, otherwise show loading or em dash
  // Note: This will be throttled by the request queue to prevent rate limits
  const shouldFetchFromVAPI = !call.duration_seconds && !!call.vapi_call_id;
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id || "placeholder" }, // Provide fallback for disabled queries
    {
      enabled: shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 2, // Retry up to 2 times (fewer retries for table cells)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, max 30s
    },
  );

  if (call.duration_seconds) {
    return (
      <span className="text-xs">{formatDuration(call.duration_seconds)}</span>
    );
  }

  if (shouldFetchFromVAPI && vapiQuery.isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="text-muted-foreground h-2.5 w-2.5 animate-spin" />
      </div>
    );
  }

  if (shouldFetchFromVAPI && vapiQuery.data?.duration) {
    return (
      <span className="text-xs">{formatDuration(vapiQuery.data.duration)}</span>
    );
  }

  return <span className="text-muted-foreground text-xs">—</span>;
}

/**
 * Icons showing if call is associated with appointments
 */
export function CallAlertsIcons({ vapiCallId }: { vapiCallId: string | null }) {
  // Check if this call is associated with appointments via vapiCallId
  const { data: appointmentExists } =
    api.inbound.checkCallAppointmentAssociation.useQuery(
      { callId: vapiCallId! },
      {
        enabled: !!vapiCallId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  return (
    <div className="flex items-center justify-center gap-1">
      {appointmentExists && (
        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      )}
    </div>
  );
}
