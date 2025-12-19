import { Phone, Calendar, MessageSquare } from "lucide-react";
import type { ViewMode } from "../types";

interface EmptyDetailStateProps {
  viewMode: ViewMode;
}

/**
 * Empty state shown when no item is selected
 */
export function EmptyDetailState({ viewMode }: EmptyDetailStateProps) {
  const config = {
    calls: {
      icon: Phone,
      title: "Select a call",
      description: "Choose a call from the list to view details",
    },
    appointments: {
      icon: Calendar,
      title: "Select an appointment",
      description: "Choose an appointment request to review and confirm",
    },
    messages: {
      icon: MessageSquare,
      title: "Select a message",
      description: "Choose a message to view and respond",
    },
  };

  const { icon: Icon, title, description } = config[viewMode];

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
        <Icon className="h-8 w-8 text-teal-600/30 dark:text-teal-400/30" />
      </div>
      <p className="text-muted-foreground text-lg font-medium">{title}</p>
      <p className="text-muted-foreground/60 mt-1 text-sm">{description}</p>
    </div>
  );
}
