import { format, isValid } from "date-fns";
import { Eye } from "lucide-react";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration } from "../table-cells";
import { OutcomeBadge } from "../outcome-badge";
import { getCallModifications } from "../../mock-data";
import { Button } from "@odis-ai/shared/ui/button";

// Use Database type for compatibility with table data and demo functions
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
  /** Whether this row is currently selected (detail panel open) */
  isSelected?: boolean;
  /** Callback when action button is clicked (toggles the detail panel) */
  onToggleDetail?: () => void;
}

/**
 * Safely parse a date string, returning a fallback date if invalid
 */
function safeParseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isValid(date) ? date : new Date();
}

export function CallRow({
  call,
  isCompact = false,
  isSelected = false,
  onToggleDetail,
}: CallRowProps) {
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
      <td className={`py-2 ${isCompact ? "text-right" : "text-center"}`}>
        {isCompact ? (
          <span className="text-xs font-medium text-slate-800">
            {format(displayDate, "MMM d, h:mm a")}
          </span>
        ) : (
          <CallDuration call={call} />
        )}
      </td>
      {!isCompact && (
        <td className="py-2 text-right">
          <span className="text-xs font-medium text-slate-800">
            {format(displayDate, "MMM d, h:mm a")}
          </span>
        </td>
      )}
      <td className="py-2 pr-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 transition-colors duration-150 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDetail?.();
          }}
          aria-label={
            isSelected
              ? `Close details for call from ${call.customer_phone ?? "unknown"}`
              : `View details for call from ${call.customer_phone ?? "unknown"}`
          }
        >
          <Eye
            className={`h-4 w-4 transition-all duration-200 ${
              isSelected
                ? "text-teal-600 hover:text-teal-700 drop-shadow-[0_0_4px_rgba(13,148,136,0.4)] stroke-[2.5]"
                : "text-slate-400 hover:text-slate-600 stroke-2"
            }`}
          />
        </Button>
      </td>
    </>
  );
}
