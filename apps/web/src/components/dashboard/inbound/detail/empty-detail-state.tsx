import { Phone } from "lucide-react";

export function EmptyDetailState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
        <Phone className="h-8 w-8 text-teal-600/30 dark:text-teal-400/30" />
      </div>
      <p className="text-muted-foreground text-lg font-medium">Select a call</p>
      <p className="text-muted-foreground/60 mt-1 text-sm">
        Choose a call from the list to view details
      </p>
    </div>
  );
}
