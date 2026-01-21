import { format, isValid } from "date-fns";
import { Eye, X } from "lucide-react";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration } from "../table-cells";
import { OutcomeBadge } from "../outcome-badge";
import { getCallModifications } from "../../demo-data";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";
import {
  BusinessHoursBadge,
  type BusinessHoursStatus,
} from "../business-hours-badge";

// Use Database type for compatibility with table data and demo functions
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
  /** Whether this row is currently selected (detail panel open) */
  isSelected?: boolean;
  /** Callback when action button is clicked (toggles the detail panel) */
  onToggleDetail?: () => void;
  /** Whether checkboxes are shown (affects first cell padding) */
  showCheckboxes?: boolean;
  /** Function to determine business hours status for a timestamp */
  getBusinessHoursStatus?: (timestamp: Date | string) => BusinessHoursStatus;
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
  showCheckboxes = false,
  getBusinessHoursStatus,
}: CallRowProps) {
  const callMods = getCallModifications(call);
  // Use created_at for consistent sorting with backend
  const displayDate = callMods.adjustedDate ?? safeParseDate(call.created_at);

  // Get business hours status for this call
  const businessHoursStatus = getBusinessHoursStatus
    ? getBusinessHoursStatus(displayDate)
    : undefined;

  return (
    <>
      <td className={`py-2 ${showCheckboxes ? "pl-2" : "pl-4"}`}>
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
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-medium text-slate-800">
              {format(displayDate, "MMM d, h:mm a")}
            </span>
            {businessHoursStatus && (
              <BusinessHoursBadge
                status={businessHoursStatus}
                showLabel={false}
              />
            )}
          </div>
        ) : (
          <CallDuration call={call} />
        )}
      </td>
      {!isCompact && (
        <td className="py-2 text-right">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-medium text-slate-800">
              {format(displayDate, "MMM d, h:mm a")}
            </span>
            {businessHoursStatus && (
              <BusinessHoursBadge
                status={businessHoursStatus}
                showLabel={true}
              />
            )}
          </div>
        </td>
      )}
      <td className="py-2 pr-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            "transition-colors duration-150",
            isSelected
              ? "bg-teal-100 text-teal-700 hover:bg-teal-200 hover:text-teal-800"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
          )}
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
          {isSelected ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </td>
    </>
  );
}
