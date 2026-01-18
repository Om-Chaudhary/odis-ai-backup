"use client";

import { X, Phone, Mail } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { AttentionBadgeGroup } from "~/components/dashboard/shared";

interface CompactPatientHeaderProps {
  patient: {
    name: string;
    species: string | null;
    breed: string | null;
    dateOfBirth: string | null;
  };
  owner: {
    name: string | null;
  };
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  attentionTypes?: string[];
  attentionSeverity?: string | null;
  onClose?: () => void;
}

const SPECIES_EMOJI_MAP: Record<string, string> = {
  canine: "🐕",
  dog: "🐕",
  feline: "🐈",
  cat: "🐈",
  avian: "🦜",
  bird: "🦜",
  equine: "🐴",
  horse: "🐴",
  bovine: "🐄",
  cow: "🐄",
  caprine: "🐐",
  goat: "🐐",
  ovine: "🐑",
  sheep: "🐑",
  porcine: "🐷",
  pig: "🐷",
  reptile: "🦎",
  amphibian: "🐸",
  rabbit: "🐇",
  rodent: "🐭",
  exotic: "🦎",
};

function getSpeciesEmoji(species: string | null): string {
  if (!species) return "🐾";
  const normalized = species.toLowerCase().trim();
  return SPECIES_EMOJI_MAP[normalized] ?? "🐾";
}

function calculateAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null;

  try {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    const ageInYears = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();

    if (ageInYears === 0) {
      const ageInMonths = monthDiff + (now.getDate() < dob.getDate() ? -1 : 0);
      return ageInMonths <= 0 ? "<1mo" : `${ageInMonths}mo`;
    }

    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())
        ? ageInYears - 1
        : ageInYears;

    return `${adjustedAge}y`;
  } catch {
    return null;
  }
}

export function CompactPatientHeader({
  patient,
  owner,
  ownerPhone,
  ownerEmail,
  attentionTypes = [],
  attentionSeverity: _attentionSeverity,
  onClose,
}: CompactPatientHeaderProps) {
  const emoji = getSpeciesEmoji(patient.species);
  const age = calculateAge(patient.dateOfBirth);
  const hasAttentionTypes = attentionTypes.length > 0;

  return (
    <div className="relative overflow-hidden">
      {/* Glassmorphic background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-teal-500/[0.08] via-teal-400/[0.04] to-cyan-500/[0.06]",
          "dark:from-teal-500/[0.12] dark:via-teal-400/[0.06] dark:to-cyan-500/[0.08]",
        )}
      />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Subtle glow accents */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-cyan-400/8 blur-xl" />

      {/* Content */}
      <div className="relative px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Avatar + Info */}
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Species avatar - glassmorphic circle */}
            <div
              className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-2xl",
                "bg-white/60 dark:bg-white/10",
                "shadow-sm shadow-teal-500/10",
                "ring-1 ring-teal-500/10",
              )}
            >
              {emoji}
            </div>

            {/* Patient & Owner info */}
            <div className="min-w-0 flex-1 space-y-0.5">
              {/* Patient name - large and prominent */}
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                {patient.name}
              </h2>

              {/* Owner name with subtle styling */}
              {owner.name && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Owner:{" "}
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {owner.name}
                  </span>
                </p>
              )}

              {/* Breed/Age inline */}
              {(patient.breed ?? patient.species ?? age) && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {patient.breed ?? patient.species}
                  {age && (patient.breed ?? patient.species) && " · "}
                  {age}
                </p>
              )}
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                "text-slate-400 hover:text-slate-600",
                "transition-colors hover:bg-slate-500/10",
                "dark:text-slate-500 dark:hover:text-slate-300",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Contact chips - inline glassmorphic pills */}
        {(ownerPhone ?? ownerEmail) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {ownerPhone && (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                  "bg-white/50 dark:bg-white/5",
                  "text-slate-600 dark:text-slate-300",
                  "ring-1 ring-slate-200/50 dark:ring-slate-700/50",
                )}
              >
                <Phone className="h-3 w-3 text-teal-500" />
                <span className="font-medium">{ownerPhone}</span>
              </div>
            )}
            {ownerEmail && (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                  "bg-white/50 dark:bg-white/5",
                  "text-slate-600 dark:text-slate-300",
                  "ring-1 ring-slate-200/50 dark:ring-slate-700/50",
                  "max-w-[200px]",
                )}
              >
                <Mail className="h-3 w-3 text-teal-500" />
                <span className="truncate font-medium">{ownerEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* Attention badges */}
        {hasAttentionTypes && (
          <div className="mt-2.5">
            <AttentionBadgeGroup
              types={attentionTypes}
              maxVisible={3}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Bottom border - subtle gradient line */}
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
    </div>
  );
}
