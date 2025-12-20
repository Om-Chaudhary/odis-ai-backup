import { format } from "date-fns";
import { PawPrint, User, CheckCircle2 } from "lucide-react";
import { Button } from "@odis-ai/ui/button";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { AppointmentStatusBadge } from "../../../shared";
import type { AppointmentRequest } from "../../types";

export function AppointmentRow({
  appointment,
  onQuickAction,
}: {
  appointment: AppointmentRequest;
  onQuickAction?: (id: string) => Promise<void>;
}) {
  const isPending = appointment.status === "pending";

  return (
    <>
      <td className="py-3 pl-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <PawPrint className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium">
              {appointment.patientName}
            </span>
            {appointment.isNewClient && (
              <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground text-xs">
              {appointment.clientName}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {formatPhoneNumber(appointment.clientPhone)}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3">
        <span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-0.5 text-xs font-medium">
          {appointment.species ?? "Unknown"}
          {appointment.breed && ` · ${appointment.breed}`}
        </span>
      </td>
      <td className="py-3">
        <span className="text-muted-foreground line-clamp-2 text-sm">
          {appointment.reason ?? "-"}
        </span>
      </td>
      <td className="py-3 text-center">
        <AppointmentStatusBadge status={appointment.status} />
      </td>
      <td className="py-3 text-center">
        {isPending && onQuickAction ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 bg-teal-500/10 px-3 text-xs font-medium text-teal-700 hover:bg-teal-500/20 dark:text-teal-400"
            onClick={(e) => {
              e.stopPropagation();
              void onQuickAction(appointment.id);
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Confirm
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex flex-col items-end gap-0.5">
          {appointment.requestedDate ? (
            <>
              <span className="text-xs font-medium">
                {format(new Date(appointment.requestedDate), "MMM d")}
              </span>
              {appointment.requestedStartTime && (
                <span className="text-muted-foreground text-xs">
                  {appointment.requestedStartTime.slice(0, 5)}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-xs">No preference</span>
          )}
        </div>
      </td>
    </>
  );
}
