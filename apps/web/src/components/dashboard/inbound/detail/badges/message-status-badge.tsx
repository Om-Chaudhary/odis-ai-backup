import { Badge } from "@odis-ai/shared/ui/badge";

interface MessageStatusBadgeProps {
  status: string;
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    new: { label: "New", className: "bg-amber-100 text-amber-700" },
    read: { label: "Read", className: "bg-slate-100 text-slate-600" },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-100 text-emerald-700",
    },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return <Badge className={variant.className}>{variant.label}</Badge>;
}
