import { PawPrint } from "lucide-react";

/**
 * Empty state when no case selected
 */
export function EmptyDetailState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <PawPrint className="mb-4 h-12 w-12 text-teal-600/30 dark:text-teal-400/30" />
      <p className="text-muted-foreground font-medium">No case selected</p>
      <p className="text-muted-foreground/60 text-sm">
        Click a row in the table to view details
      </p>
    </div>
  );
}
