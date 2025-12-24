"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Separator } from "@odis-ai/shared/ui/separator";
import {
  Mail,
  Phone,
  User,
  ExternalLink,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";
import { DeleteCaseDialog } from "../../cases/delete-case-dialog";
import { cn } from "@odis-ai/shared/util";
import type { DischargeCaseStatus } from "../types";

type DeliveryStatus = "sent" | "pending" | "failed" | "not_applicable" | null;

interface Patient {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  weightKg: number | null;
}

interface Owner {
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface PatientOwnerCardProps {
  caseData: {
    id: string;
    caseId: string;
    patient: Patient;
    owner: Owner;
    caseType: string | null;
    status: DischargeCaseStatus;
  };
  phoneStatus?: DeliveryStatus;
  emailStatus?: DeliveryStatus;
  onDelete?: () => void;
}

// Get species emoji
function getSpeciesEmoji(species: string | null): string {
  const speciesLower = species?.toLowerCase() ?? "";

  if (speciesLower.includes("canine") || speciesLower.includes("dog")) {
    return "🐕";
  }
  if (speciesLower.includes("feline") || speciesLower.includes("cat")) {
    return "🐈";
  }
  if (speciesLower.includes("avian") || speciesLower.includes("bird")) {
    return "🐦";
  }
  if (speciesLower.includes("rabbit") || speciesLower.includes("bunny")) {
    return "🐰";
  }
  if (speciesLower.includes("hamster")) {
    return "🐹";
  }
  if (speciesLower.includes("fish")) {
    return "🐠";
  }
  if (speciesLower.includes("reptile") || speciesLower.includes("lizard")) {
    return "🦎";
  }
  if (speciesLower.includes("horse") || speciesLower.includes("equine")) {
    return "🐴";
  }
  return "🐾";
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null;

  try {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays}d`;
    }

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years === 0) {
      return `${months}m`;
    }

    return months > 0 ? `${years}y ${months}m` : `${years}y`;
  } catch {
    return null;
  }
}

// Get status badge config
function getStatusConfig(status: DischargeCaseStatus) {
  const statusConfig: Record<
    DischargeCaseStatus,
    { label: string; className: string }
  > = {
    ready: {
      label: "Ready",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    },
    pending_review: {
      label: "Pending Review",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    },
    scheduled: {
      label: "Scheduled",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    },
    completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
    in_progress: {
      label: "In Progress",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    },
  };

  return (
    statusConfig[status] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700",
    }
  );
}

// Delivery status indicator component
function DeliveryIndicator({ status }: { status: DeliveryStatus }) {
  if (status === "sent") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  }
  if (status === "failed") {
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  }
  if (status === "pending") {
    return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  }
  return null;
}

/**
 * Patient Owner Card - Redesigned compact card with glassmorphism styling.
 * Shows patient info with species icon/emoji, owner contact info, status badge, and action buttons.
 */
export function PatientOwnerCard({
  caseData,
  phoneStatus,
  emailStatus,
  onDelete,
}: PatientOwnerCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const age = calculateAge(caseData.patient.dateOfBirth);
  const speciesEmoji = getSpeciesEmoji(caseData.patient.species);
  const statusConfig = getStatusConfig(caseData.status);

  // Build pet metadata string
  const petMetadata = [caseData.patient.species, caseData.patient.breed, age]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "rounded-xl border border-teal-200/50 dark:border-teal-800/50",
        "bg-gradient-to-br from-white/80 via-teal-50/30 to-white/80",
        "dark:from-slate-900/80 dark:via-teal-950/30 dark:to-slate-900/80",
        "shadow-sm backdrop-blur-md",
        "p-4",
      )}
    >
      {/* Top row: Pet info + Status + Actions */}
      <div className="flex items-start justify-between gap-3">
        {/* Pet Avatar + Info */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Species Avatar */}
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-teal-100 to-emerald-100",
              "dark:from-teal-900/50 dark:to-emerald-900/50",
              "text-2xl shadow-inner",
            )}
          >
            {speciesEmoji}
          </div>

          {/* Pet Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-800 dark:text-white">
                {caseData.patient.name.toUpperCase()}
              </h2>
              <Badge
                className={cn(
                  "shrink-0 text-xs font-medium",
                  statusConfig.className,
                )}
              >
                {statusConfig.label}
              </Badge>
            </div>
            {petMetadata && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {petMetadata}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 bg-white/50 px-2 text-xs dark:bg-slate-800/50"
            asChild
          >
            <Link href={`/dashboard/cases/${caseData.caseId}`}>
              <ExternalLink className="h-3 w-3" />
              View
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 gap-1 bg-white/50 px-2 text-xs dark:bg-slate-800/50"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Separator className="my-3 bg-teal-200/30 dark:bg-teal-800/30" />

      {/* Owner Section */}
      <div className="space-y-2">
        {/* Owner Name */}
        {caseData.owner.name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {caseData.owner.name.toUpperCase()}
            </span>
          </div>
        )}

        {/* Contact Info Row with Delivery Status */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {caseData.owner.phone && (
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${caseData.owner.phone}`}
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  "text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",
                  "transition-colors",
                )}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{formatPhoneNumber(caseData.owner.phone)}</span>
              </a>
              <DeliveryIndicator status={phoneStatus ?? null} />
            </div>
          )}
          {caseData.owner.email && (
            <div className="flex items-center gap-1.5">
              <a
                href={`mailto:${caseData.owner.email}`}
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  "text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",
                  "transition-colors",
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="max-w-[180px] truncate">
                  {caseData.owner.email}
                </span>
              </a>
              <DeliveryIndicator status={emailStatus ?? null} />
            </div>
          )}
        </div>
      </div>

      <DeleteCaseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        caseId={caseData.id}
        patientName={caseData.patient.name}
        onSuccess={onDelete}
      />
    </div>
  );
}
