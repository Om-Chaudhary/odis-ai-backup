import { format, isValid } from "date-fns";
import { PriorityBadge } from "../../../shared";
import { CallerDisplay } from "../table-cells";
import type { ClinicMessage } from "../../types";

interface MessageRowProps {
  message: ClinicMessage;
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
            {format(safeParseDate(message.createdAt), "MMM d, h:mm a")}
          </span>
        </td>
      )}
    </>
  );
}
