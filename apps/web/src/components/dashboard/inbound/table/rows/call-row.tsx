import { format } from "date-fns";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration, CallAlertsIcons } from "../table-cells";
import {
  CallStatusBadge,
  AttentionBadgeGroup,
  CriticalPulsingDot,
} from "../../../shared";
import { getCallModifications } from "../../demo-data";

// Base type from database
type InboundCallRow = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

// Extended type with call intelligence columns (added via migration)
type InboundCall = InboundCallRow & {
  attention_types?: string[] | null;
  attention_severity?: string | null;
  attention_summary?: string | null;
  attention_flagged_at?: string | null;
};

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
}

export function CallRow({ call, isCompact = false }: CallRowProps) {
  const callMods = getCallModifications(call);
  // Use created_at for consistent sorting with backend
  const displayDate = callMods.adjustedDate ?? new Date(call.created_at);

  // Check for attention flags
  const hasAttention = call.attention_types && call.attention_types.length > 0;
  const isCritical = call.attention_severity === "critical";

  return (
    <>
      <td className="py-3 pl-3">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <CallerDisplay
            phone={call.customer_phone}
            clinicName={call.clinic_name}
          />
          {/* Attention indicators */}
          {hasAttention && (
            <div className="mt-0.5 flex items-center gap-1">
              {isCritical && <CriticalPulsingDot />}
              <AttentionBadgeGroup
                types={call.attention_types ?? []}
                maxVisible={2}
                size="sm"
              />
            </div>
          )}
        </div>
      </td>
      <td className="py-3 text-center">
        <CallStatusBadge status={call.status} />
      </td>
      <td className="py-3 text-center">
        <CallAlertsIcons vapiCallId={call.vapi_call_id} />
      </td>
      <td className="py-3 text-center">
        <CallDuration call={call} />
      </td>
      {!isCompact && (
        <td className="py-3 pr-3 text-right">
          <div className="flex flex-col items-end gap-0">
            <span className="text-xs font-medium text-slate-800">
              {format(displayDate, "MMM d, yyyy")}
            </span>
            <span className="text-xs text-slate-500">
              {format(displayDate, "h:mm a")}
            </span>
          </div>
        </td>
      )}
    </>
  );
}
