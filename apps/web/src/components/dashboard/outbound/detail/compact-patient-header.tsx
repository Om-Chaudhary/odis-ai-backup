"use client";

import { X, Phone, User, PawPrint } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

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

export function CompactPatientHeader({
  patient,
  owner,
  ownerPhone,
  ownerEmail: _ownerEmail,
  attentionTypes: _attentionTypes = [],
  attentionSeverity: _attentionSeverity,
  onClose,
}: CompactPatientHeaderProps) {
  return (
    <header className="border-b border-border/40 bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.02]">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            "bg-gradient-to-br from-primary/15 to-primary/5",
            "ring-1 ring-primary/10",
          )}
        >
          <PawPrint className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>

        {/* Info Stack */}
        <div className="min-w-0 flex-1">
          {/* Name Row */}
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {patient.name}
            </h2>
            {owner.name && (
              <>
                <span className="text-border">·</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{owner.name}</span>
                </div>
              </>
            )}
          </div>

          {/* Phone */}
          {ownerPhone && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-[13px] tabular-nums text-muted-foreground">
                {ownerPhone}
              </span>
            </div>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              "text-muted-foreground/50 hover:text-foreground",
              "transition-colors hover:bg-muted/80",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
