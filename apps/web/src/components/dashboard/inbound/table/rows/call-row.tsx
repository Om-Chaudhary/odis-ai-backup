import { format } from "date-fns";
import type { Database } from "@odis-ai/shared/types";
import { CallerDisplay, CallDuration, CallAlertsIcons } from "../table-cells";
import { CallStatusBadge } from "../../../shared";
import { getCallModifications } from "../../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallRowProps {
  call: InboundCall;
  isCompact?: boolean;
}

export function CallRow({ call, isCompact = false }: CallRowProps) {
  const callMods = getCallModifications(call);
  // Use created_at for consistent sorting with backend
  const displayDate = callMods.adjustedDate ?? new Date(call.created_at);

  return (
    <>
      <td className="py-3 pl-3">
        <CallerDisplay
          phone={call.customer_phone}
          clinicName={call.clinic_name}
        />
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
            <span className="text-xs font-medium">
              {format(displayDate, "MMM d, yyyy")}
            </span>
            <span className="text-muted-foreground text-xs">
              {format(displayDate, "h:mm a")}
            </span>
          </div>
        </td>
      )}
    </>
  );
}
