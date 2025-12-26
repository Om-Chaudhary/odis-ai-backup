import { format } from "date-fns";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration } from "../table-cells";
import { OutcomeBadge } from "../outcome-badge";
import { getCallModifications } from "../../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface StructuredData {
  call_outcome?: string;
  [key: string]: unknown;
}

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
}

export function CallRow({ call, isCompact = false }: CallRowProps) {
  const callMods = getCallModifications(call);
  // Use created_at for consistent sorting with backend
  const displayDate = callMods.adjustedDate ?? new Date(call.created_at);

  // Extract outcome from structured_data JSON column if available
  const structuredData = call.structured_data as StructuredData | null;
  const outcome = structuredData?.call_outcome ?? null;

  return (
    <>
      <td className="py-3 pl-3">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <CallerDisplay
            phone={call.customer_phone}
            clinicName={call.clinic_name}
          />
        </div>
      </td>
      <td className="py-3 text-center">
        <OutcomeBadge outcome={outcome} />
      </td>
      <td className="py-3 text-center">
        <CallDuration call={call} />
      </td>
      {!isCompact && (
        <td className="py-3 pr-3 text-right">
          {/* Compact single-line date/time format */}
          <span className="text-xs font-medium text-slate-800">
            {format(displayDate, "MMM d, h:mm a")}
          </span>
        </td>
      )}
    </>
  );
}
