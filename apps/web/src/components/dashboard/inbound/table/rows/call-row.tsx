import { format } from "date-fns";
import type { Database } from "~/database.types";
import { CallerDisplay, CallDuration, CallAlertsIcons } from "../table-cells";
import { CallStatusBadge } from "../../../shared";
import { getCallModifications } from "../../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

export function CallRow({ call }: { call: InboundCall }) {
  const callMods = getCallModifications(call);
  // Use started_at (actual VAPI call time) with fallback to created_at
  const displayDate =
    callMods.adjustedDate ?? new Date(call.started_at ?? call.created_at);

  return (
    <>
      <td className="py-3 pl-4">
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
      <td className="py-3 pr-4 text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium">
            {format(displayDate, "MMM d, yyyy")}
          </span>
          <span className="text-muted-foreground text-xs">
            {format(displayDate, "h:mm a")}
          </span>
        </div>
      </td>
    </>
  );
}
