import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@odis-ai/utils";
import { Button } from "@odis-ai/ui/button";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { MessageStatusBadge, PriorityBadge } from "../../../shared/status-badges";
import type { ClinicMessage } from "../../types";

export function MessageRow({
  message,
  onQuickAction,
}: {
  message: ClinicMessage;
  onQuickAction?: (id: string) => Promise<void>;
}) {
  const isNew = message.status === "new";
  const isUrgent = message.priority === "urgent";

  return (
    <>
      <td className="py-3 pl-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {message.callerName ?? "Unknown"}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatPhoneNumber(message.callerPhone)}
          </span>
        </div>
      </td>
      <td className="py-3">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {message.messageContent}
        </p>
      </td>
      <td className="py-3 text-center">
        <PriorityBadge priority={message.priority} />
      </td>
      <td className="py-3 text-center">
        <MessageStatusBadge status={message.status} />
      </td>
      <td className="py-3 text-center">
        {isNew && onQuickAction ? (
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-7 gap-1.5 px-3 text-xs font-medium",
              isUrgent
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-400",
            )}
            onClick={(e) => {
              e.stopPropagation();
              void onQuickAction(message.id);
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Read
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium">
            {format(new Date(message.createdAt), "MMM d, yyyy")}
          </span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
        </div>
      </td>
    </>
  );
}
