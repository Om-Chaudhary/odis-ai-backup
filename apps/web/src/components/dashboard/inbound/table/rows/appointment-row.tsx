import { format } from "date-fns";
import { AppointmentStatusBadge } from "../../../shared";
import { CallerDisplay } from "../table-cells";
import type { AppointmentRequest } from "../../types";

interface AppointmentRowProps {
  appointment: AppointmentRequest;
  isCompact?: boolean;
}

export function AppointmentRow({
  appointment,
  isCompact = false,
}: AppointmentRowProps) {
  return (
    <>
      <td className="py-3 pl-3">
        <CallerDisplay phone={appointment.clientPhone} />
      </td>
      <td className="py-3 text-center">
        <AppointmentStatusBadge status={appointment.status} />
      </td>
      {!isCompact && (
        <td className="py-3 pr-3 text-right">
          <span className="text-xs font-medium text-slate-800">
            {format(new Date(appointment.createdAt), "MMM d, h:mm a")}
          </span>
        </td>
      )}
    </>
  );
}
