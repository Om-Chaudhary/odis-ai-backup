import { Badge } from "@odis-ai/ui/badge";
import { cn } from "@odis-ai/utils";

// =============================================================================
// Appointment Status Badge (Large - for detail view)
// =============================================================================

interface AppointmentStatusBadgeLargeProps {
  status: string;
  className?: string;
}

export function AppointmentStatusBadgeLarge({
  status,
  className,
}: AppointmentStatusBadgeLargeProps) {
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

  return (
    <Badge className={cn(variant.className, className)}>{variant.label}</Badge>
  );
}

// =============================================================================
// Message Status Badge (Large - for detail view)
// =============================================================================

interface MessageStatusBadgeLargeProps {
  status: string;
  className?: string;
}

export function MessageStatusBadgeLarge({
  status,
  className,
}: MessageStatusBadgeLargeProps) {
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

  return (
    <Badge className={cn(variant.className, className)}>{variant.label}</Badge>
  );
}
