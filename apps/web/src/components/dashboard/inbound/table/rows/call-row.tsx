import { format, isValid } from "date-fns";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration } from "../table-cells";
import { OutcomeBadge } from "../outcome-badge";
import { getCallModifications } from "../../demo-data";

// Use Database type for compatibility with table data and demo functions
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
}

/**
 * Safely parse a date string, returning a fallback date if invalid
 */
function safeParseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isValid(date) ? date : new Date();
}

export function CallRow({ call, isCompact = false }: CallRowProps) {
  const callMods = getCallModifications(call);
  // Use created_at for consistent sorting with backend
  const displayDate = callMods.adjustedDate ?? safeParseDate(call.created_at);

  return (
    <>
      <td className="py-2 pl-4">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <CallerDisplay
            phone={call.customer_phone}
            clinicName={call.clinic_name}
          />
        </div>
      </td>
      <td className="py-2 text-center">
        <OutcomeBadge call={call} />
      </td>
      <td className={`py-2 ${isCompact ? "pr-4 text-right" : "text-center"}`}>
        {isCompact ? (
          <span className="text-xs font-medium text-slate-800">
            {format(displayDate, "MMM d, h:mm a")}
          </span>
        ) : (
          <CallDuration call={call} />
        )}
      </td>
      {!isCompact && (
        <td className="py-2 pr-4 text-right">
          {/* Compact single-line date/time format */}
          <span className="text-xs font-medium text-slate-800">
            {format(displayDate, "MMM d, h:mm a")}
          </span>
        </td>
      )}
    </>
  );
}
