"use client";

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
  onClose: _onClose,
}: CompactPatientHeaderProps) {
  const emoji = getSpeciesEmoji(patient.species);
  const age = calculateAge(patient.dateOfBirth);
  const hasAttentionTypes = attentionTypes.length > 0;

  return (
    <div className="bg-muted/30 relative border-b px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Species emoji avatar */}
          <div className="bg-background flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-2xl shadow-sm">
            {emoji}
          </div>

          {/* Patient info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="truncate text-lg font-semibold">{patient.name}</h2>
              {(patient.breed ?? patient.species) && (
                <span className="text-muted-foreground text-sm">
                  {patient.breed ?? patient.species}
                  {age && ` • ${age}`}
                </span>
              )}
              {!patient.breed && !patient.species && age && (
                <span className="text-muted-foreground text-sm">{age}</span>
              )}
            </div>

            {owner.name && (
              <p className="text-muted-foreground text-sm">
                Owner: {owner.name}
              </p>
            )}

            {/* Contact information */}
            {(ownerPhone ?? ownerEmail) && (
              <div className="flex flex-wrap gap-3 pt-0.5">
                {ownerPhone && (
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <span>📞</span>
                    <span className="font-medium">{ownerPhone}</span>
                  </div>
                )}
                {ownerEmail && (
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <span>✉️</span>
                    <span className="truncate font-medium">{ownerEmail}</span>
                  </div>
                )}
              </div>
            )}

            {/* Attention type badges */}
            {hasAttentionTypes && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <AttentionBadgeGroup
                  types={attentionTypes}
                  maxVisible={3}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
