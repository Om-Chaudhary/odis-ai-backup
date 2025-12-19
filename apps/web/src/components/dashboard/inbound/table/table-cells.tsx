/**
 * Shared table cell components
 */

import { Calendar, MessageSquare, Loader2 } from "lucide-react";
import { api } from "~/trpc/client";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { formatDuration } from "../../shared/utils";
import { getDemoCallerName, getCallModifications } from "../demo-data";
import type { Database } from "~/database.types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Displays caller name if available, otherwise falls back to phone number
 * Looks up caller name from static mapping and database
 */
export function CallerDisplay({
  phone,
  clinicName,
}: {
  phone: string | null;
  clinicName: string | null;
}) {
  const formattedPhone = formatPhoneNumber(phone ?? "") || "Unknown";

  // Check static demo mapping first
  const demoName = getDemoCallerName(phone);

  // Query for caller name by phone number (skip if we found demo name)
  const { data: callerInfo, isLoading } =
    api.inbound.getCallerNameByPhone.useQuery(
      { phone: phone ?? "" },
      {
        enabled: !!phone && !demoName,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  // Display caller name: demo name > API result > phone number
  const displayName = demoName ?? callerInfo?.name ?? formattedPhone;
  const hasName = !!(demoName ?? callerInfo?.name);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">
        {isLoading && !demoName ? (
          <span className="text-muted-foreground">{formattedPhone}</span>
        ) : (
          displayName
        )}
      </span>
      {/* Show phone number below name if we found a name, otherwise show clinic */}
      {hasName ? (
        <span className="text-muted-foreground text-xs">{formattedPhone}</span>
      ) : (
        clinicName && (
          <span className="text-muted-foreground text-xs">{clinicName}</span>
        )
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

  // Silent calls show blank duration
  if (callMods.isSilent) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Use existing duration if available, otherwise show loading or dash
  const shouldFetchFromVAPI = !call.duration_seconds && !!call.vapi_call_id;
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: () => shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false,
    },
  );

  if (call.duration_seconds) {
    return (
      <span className="text-sm">{formatDuration(call.duration_seconds)}</span>
    );
  }

  if (shouldFetchFromVAPI && vapiQuery.isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (shouldFetchFromVAPI && vapiQuery.data?.duration) {
    return (
      <span className="text-sm">{formatDuration(vapiQuery.data.duration)}</span>
    );
  }

  return <span className="text-muted-foreground text-sm">-</span>;
}

/**
 * Icons showing if call is associated with appointments or messages
 */
export function CallAlertsIcons({ vapiCallId }: { vapiCallId: string | null }) {
  // Check if this call is associated with appointments or messages via vapiCallId
  const { data: appointmentExists } =
    api.inbound.checkCallAppointmentAssociation.useQuery(
      { callId: vapiCallId! },
      {
        enabled: !!vapiCallId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  const { data: messageExists } =
    api.inbound.checkCallMessageAssociation.useQuery(
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
      {messageExists && (
        <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
      )}
    </div>
  );
}
