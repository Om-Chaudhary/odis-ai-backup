/**
 * Shared table cell components
 */

import { Calendar, Loader2, PawPrint } from "lucide-react";
import { api } from "~/trpc/client";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";
import { formatDuration } from "../../shared/utils";
import { getDemoCallerName, getCallModifications } from "../demo-data";
import type { Database } from "@odis-ai/shared/types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Displays caller information with name as primary when available
 *
 * Display hierarchy:
 * 1. Caller name (primary, bold) + phone (secondary, muted) when name is known
 * 2. Phone only (primary, bold) when no name available
 * 3. Pet name always shown below with paw icon
 */
export function CallerDisplay({
  phone,
}: {
  phone: string | null;
  clinicName?: string | null; // Kept for backwards compatibility but not displayed
}) {
  const formattedPhone = formatPhoneNumber(phone ?? "") || "Unknown";

  // Check static demo mapping first
  const demoName = getDemoCallerName(phone);

  // Query for caller info by phone number (skip if we found demo name)
  const { data: callerInfo, isLoading } =
    api.inbound.getCallerNameByPhone.useQuery(
      { phone: phone ?? "" },
      {
        enabled: !!phone && !demoName,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  // Get caller name: demo name > API result > null
  const callerName = demoName ?? callerInfo?.name ?? null;
  const petName = callerInfo?.petName ?? null;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Primary line: Name if available, otherwise phone */}
      {callerName ? (
        <>
          <span className="truncate text-sm font-semibold">{callerName}</span>
          <span className="text-muted-foreground text-xs">
            {formattedPhone}
          </span>
        </>
      ) : (
        <span className="text-sm font-semibold">
          {isLoading && !demoName ? (
            <span className="text-muted-foreground">{formattedPhone}</span>
          ) : (
            formattedPhone
          )}
        </span>
      )}
      {/* Pet name with icon - always shown below */}
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
    { vapiCallId: call.vapi_call_id },
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
