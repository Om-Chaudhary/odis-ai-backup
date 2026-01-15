import { format, isValid } from "date-fns";
import { Play, FileText, Copy } from "lucide-react";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration } from "../table-cells";
import { OutcomeBadge } from "../outcome-badge";
import { getCallModifications } from "../../demo-data";
import { RowActionMenu, type RowAction } from "../../../shared/row-action-menu";
import { useToast } from "~/hooks/use-toast";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";

// Use Database type for compatibility with table data and demo functions
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
  /** Callback when "View Transcript" is clicked (selects the row) */
  onViewTranscript?: () => void;
  /** Whether checkboxes are shown (affects first cell padding) */
  showCheckboxes?: boolean;
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
  onViewTranscript,
  showCheckboxes = false,
}: CallRowProps) {
  const callMods = getCallModifications(call);
  const { toast } = useToast();
  // Use created_at for consistent sorting with backend
  const displayDate = callMods.adjustedDate ?? safeParseDate(call.created_at);

  // Build row actions
  const actions: RowAction[] = [];

  // Play Recording - only if recording URL exists
  if (call.recording_url) {
    actions.push({
      id: "play",
      label: "Play Recording",
      icon: Play,
      onClick: () => {
        window.open(call.recording_url!, "_blank");
      },
    });
  }

  // View Transcript - always available, selects the row to show transcript
  actions.push({
    id: "transcript",
    label: "View Transcript",
    icon: FileText,
    onClick: () => {
      onViewTranscript?.();
    },
  });

  // Copy Phone Number
  if (call.customer_phone) {
    const customerPhone = call.customer_phone;
    actions.push({
      id: "copy",
      label: "Copy Phone Number",
      icon: Copy,
      onClick: () => {
        const phone = formatPhoneNumber(customerPhone) ?? customerPhone;
        void navigator.clipboard
          .writeText(phone)
          .then(() => {
            toast({
              title: "Copied!",
              description: `Phone number ${phone} copied to clipboard`,
            });
          })
          .catch(() => {
            toast({
              title: "Failed to copy",
              description: "Could not copy phone number to clipboard",
              variant: "destructive",
            });
          });
      },
    });
  }

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
        <RowActionMenu
          actions={actions}
          ariaLabel={`Actions for call from ${call.customer_phone ?? "unknown"}`}
        />
      </td>
    </>
  );
}
