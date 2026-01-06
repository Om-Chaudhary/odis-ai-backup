"use client";

import { Badge } from "@odis-ai/shared/ui/badge";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";
import { cn } from "@odis-ai/shared/util";
import type { AppointmentStatus } from "../types";

// =============================================================================
// Types
// =============================================================================

interface CallerCardProps {
  variant: "appointment" | "call";
  // Common
  phone: string | null;
  callerName: string | null;
  // Appointment-specific
  petName?: string | null;
  species?: string | null;
  breed?: string | null;
  appointmentStatus?: AppointmentStatus;
  isNewClient?: boolean | null;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get species emoji for pet avatar
 */
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

/**
 * Get appointment status badge config
 */
function getAppointmentStatusConfig(status: AppointmentStatus) {
  const config: Record<
    AppointmentStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
    confirmed: {
      label: "Confirmed",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    },
  };
  return config[status] ?? { label: status, className: "bg-slate-100" };
}

// =============================================================================
// Component
// =============================================================================

/**
 * Inbound Caller Card - Compact header showing caller/patient info.
 * Matches the styling of outbound's CompactPatientHeader.
 * Adapts display based on variant (appointment or call).
 */
export function InboundCallerCard({
  variant,
  phone,
  callerName,
  petName,
  species,
  breed,
  appointmentStatus,
  isNewClient,
}: CallerCardProps) {
  const formattedPhone = formatPhoneNumber(phone ?? "") ?? phone ?? "Unknown";
  const hasPetInfo = petName ?? species;

  // Build pet metadata string
  const petMetadata = [species, breed].filter(Boolean).join(" · ");

  // Determine avatar emoji
  const avatarEmoji = hasPetInfo ? getSpeciesEmoji(species ?? null) : "🐾";

  // Determine status badge
  const renderStatusBadge = () => {
    if (variant === "appointment" && appointmentStatus) {
      const config = getAppointmentStatusConfig(appointmentStatus);
      return (
        <Badge className={cn("shrink-0 text-xs font-medium", config.className)}>
          {config.label}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-2">
      {/* Top row: Avatar + Primary Info */}
      <div className="flex items-start gap-3">
        {/* Species emoji avatar - matches outbound style */}
        <div className="bg-background flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-2xl shadow-sm">
          {avatarEmoji}
        </div>

        {/* Patient/Caller info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {hasPetInfo ? (
              <>
                <h2 className="truncate text-lg font-semibold">
                  {petName ?? "Unknown Pet"}
                </h2>
                {petMetadata && (
                  <span className="text-muted-foreground text-sm">
                    {petMetadata}
                  </span>
                )}
                {renderStatusBadge()}
              </>
            ) : (
              <>
                <a
                  href={`tel:${phone}`}
                  className="truncate text-lg font-semibold hover:text-teal-600 dark:hover:text-teal-400"
                >
                  {formattedPhone}
                </a>
                {renderStatusBadge()}
              </>
            )}
          </div>

          {/* Owner/Caller name (secondary line) */}
          {callerName && (
            <p className="text-muted-foreground text-sm">
              {hasPetInfo ? `Owner: ${callerName}` : callerName}
            </p>
          )}

          {/* Contact information - only show if we have pet info */}
          {hasPetInfo && phone && (
            <div className="flex flex-wrap gap-3 pt-0.5">
              <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <span>📞</span>
                <a
                  href={`tel:${phone}`}
                  className="font-medium hover:text-teal-600 dark:hover:text-teal-400"
                >
                  {formattedPhone}
                </a>
              </div>
            </div>
          )}

          {/* New client badge */}
          {isNewClient && (
            <div className="pt-1">
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300"
              >
                New Client
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
