"use client";

import { Phone, User } from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Separator } from "@odis-ai/shared/ui/separator";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";
import { cn } from "@odis-ai/shared/util";
import type {
  AppointmentStatus,
  MessageStatus,
  MessagePriority,
  CallOutcome,
} from "../types";

// =============================================================================
// Types
// =============================================================================

interface CallerCardProps {
  variant: "appointment" | "call" | "message";
  // Common
  phone: string | null;
  callerName: string | null;
  // Appointment-specific
  petName?: string | null;
  species?: string | null;
  breed?: string | null;
  appointmentStatus?: AppointmentStatus;
  isNewClient?: boolean | null;
  // Call-specific
  callOutcome?: CallOutcome | null;
  // Message-specific
  messageStatus?: MessageStatus;
  priority?: MessagePriority | null;
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

/**
 * Get message status badge config
 */
function getMessageStatusConfig(status: MessageStatus) {
  const config: Record<MessageStatus, { label: string; className: string }> = {
    new: {
      label: "New",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    },
    read: {
      label: "Read",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    },
    resolved: {
      label: "Resolved",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    },
  };
  return config[status] ?? { label: status, className: "bg-slate-100" };
}

/**
 * Get call outcome badge config
 */
function getCallOutcomeConfig(outcome: CallOutcome | null) {
  if (!outcome) return null;

  const config: Record<CallOutcome, { label: string; className: string }> = {
    Scheduled: {
      label: "Scheduled",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    },
    Cancellation: {
      label: "Cancellation",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    },
    Info: {
      label: "Info",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    },
    Urgent: {
      label: "Urgent",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
    "Call Back": {
      label: "Call Back",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
    Completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    },
  };
  return config[outcome] ?? { label: outcome, className: "bg-slate-100" };
}

// =============================================================================
// Component
// =============================================================================

/**
 * Inbound Caller Card - Glassmorphism styled card showing caller/patient info.
 * Adapts display based on variant (appointment, call, message).
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
  callOutcome,
  messageStatus,
  priority,
}: CallerCardProps) {
  const formattedPhone = formatPhoneNumber(phone ?? "") ?? "Unknown";
  const hasPetInfo = petName ?? species;

  // Build pet metadata string
  const petMetadata = [species, breed].filter(Boolean).join(" · ");

  // Determine avatar content
  const avatarContent = hasPetInfo ? (
    getSpeciesEmoji(species ?? null)
  ) : (
    <Phone className="h-6 w-6 text-teal-600 dark:text-teal-400" />
  );

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
    if (variant === "call" && callOutcome) {
      const config = getCallOutcomeConfig(callOutcome);
      if (config) {
        return (
          <Badge
            className={cn("shrink-0 text-xs font-medium", config.className)}
          >
            {config.label}
          </Badge>
        );
      }
    }
    if (variant === "message" && messageStatus) {
      const config = getMessageStatusConfig(messageStatus);
      return (
        <Badge className={cn("shrink-0 text-xs font-medium", config.className)}>
          {config.label}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-teal-200/50 dark:border-teal-800/50",
        "bg-gradient-to-br from-white/80 via-teal-50/30 to-white/80",
        "dark:from-slate-900/80 dark:via-teal-950/30 dark:to-slate-900/80",
        "shadow-sm backdrop-blur-md",
        "p-4",
        priority === "urgent" && "border-red-200/50 dark:border-red-800/50",
      )}
    >
      {/* Top row: Avatar + Primary Info + Status */}
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + Info */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-teal-100 to-emerald-100",
              "dark:from-teal-900/50 dark:to-emerald-900/50",
              "text-2xl shadow-inner",
              priority === "urgent" &&
                "from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50",
            )}
          >
            {avatarContent}
          </div>

          {/* Primary Info */}
          <div className="min-w-0">
            {hasPetInfo ? (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-slate-800 dark:text-white">
                    {(petName ?? "Unknown Pet").toUpperCase()}
                  </h2>
                  {renderStatusBadge()}
                </div>
                {petMetadata && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {petMetadata}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-slate-800 dark:text-white">
                    {formattedPhone}
                  </h2>
                  {renderStatusBadge()}
                </div>
                {callerName && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {callerName}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Extra badges */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isNewClient && (
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300"
            >
              New Client
            </Badge>
          )}
          {priority === "urgent" && (
            <Badge variant="destructive" className="text-xs">
              Urgent
            </Badge>
          )}
        </div>
      </div>

      {/* Show caller section only if we have pet info (otherwise phone is already shown above) */}
      {hasPetInfo && (callerName ?? phone) && (
        <>
          <Separator className="my-3 bg-teal-200/30 dark:bg-teal-800/30" />

          {/* Caller Section */}
          <div className="space-y-1.5">
            {callerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {callerName.toUpperCase()}
                </span>
              </div>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  "text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",
                  "transition-colors",
                )}
              >
                <Phone className="h-4 w-4" />
                <span>{formattedPhone}</span>
              </a>
            )}
          </div>
        </>
      )}

      {/* For non-pet views, show clickable phone below caller name */}
      {!hasPetInfo && callerName && phone && (
        <>
          <Separator className="my-3 bg-teal-200/30 dark:bg-teal-800/30" />
          <a
            href={`tel:${phone}`}
            className={cn(
              "flex items-center gap-2 text-sm",
              "text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",
              "transition-colors",
            )}
          >
            <Phone className="h-4 w-4" />
            <span>{formattedPhone}</span>
          </a>
        </>
      )}
    </div>
  );
}
