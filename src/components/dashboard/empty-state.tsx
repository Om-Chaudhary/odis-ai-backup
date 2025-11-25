import { FileText } from "lucide-react";

export function EmptyState() {
  return (
    <div className="animate-in fade-in-50 flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No cases found</h3>
      <p className="text-muted-foreground mt-2 mb-4 max-w-sm text-sm">
        There are no cases matching your criteria. Try adjusting your filters or
        check back later for new discharge summaries.
      </p>
    </div>
  );
}
