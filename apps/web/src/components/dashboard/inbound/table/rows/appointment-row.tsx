import { format, isValid } from "date-fns";
import { AppointmentStatusBadge } from "../../../shared";
import { CallerDisplay } from "../table-cells";
import type { AppointmentRequest } from "../../types";

interface AppointmentRowProps {
  appointment: AppointmentRequest;
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
            {format(safeParseDate(appointment.createdAt), "MMM d, h:mm a")}
          </span>
        </td>
      )}
    </>
  );
}
