import { Badge } from "@odis-ai/shared/ui/badge";

interface AppointmentStatusBadgeProps {
  status: string;
}

export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending Review",
      className: "bg-amber-100 text-amber-700",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-emerald-100 text-emerald-700",
    },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return <Badge className={variant.className}>{variant.label}</Badge>;
}
