import { format } from "date-fns";
import { PriorityBadge } from "../../../shared";
import { CallerDisplay } from "../table-cells";
import type { ClinicMessage } from "../../types";

interface MessageRowProps {
  message: ClinicMessage;
  isCompact?: boolean;
}

export function MessageRow({ message, isCompact = false }: MessageRowProps) {
  return (
    <>
      <td className="py-3 pl-3">
        <CallerDisplay phone={message.callerPhone} />
      </td>
      <td className="py-3 text-center">
        <PriorityBadge priority={message.priority} />
      </td>
      {!isCompact && (
        <td className="py-3 pr-3 text-right">
          <span className="text-xs font-medium text-slate-800">
            {format(new Date(message.createdAt), "MMM d, h:mm a")}
          </span>
        </td>
      )}
    </>
  );
}
