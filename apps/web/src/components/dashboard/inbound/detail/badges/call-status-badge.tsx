import { Badge } from "@odis-ai/shared/ui/badge";

interface CallStatusBadgeProps {
  status: string;
}

export function CallStatusBadge({ status }: CallStatusBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    queued: { label: "Queued", className: "bg-yellow-100 text-yellow-700" },
    ringing: { label: "Ringing", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "Active", className: "bg-green-100 text-green-700" },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700",
    },
    failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return <Badge className={variant.className}>{variant.label}</Badge>;
}
