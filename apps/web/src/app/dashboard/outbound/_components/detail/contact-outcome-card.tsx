"use client";

import { useState } from "react";
import { Phone, Mail, Copy, Check } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";

interface ContactOutcomeCardProps {
  ownerPhone: string | null;
  ownerEmail: string | null;
  callOutcomeData?: {
    pet_recovery_status?: string;
    owner_sentiment?: string;
  } | null;
  callDuration?: number | null;
}

const RECOVERY_STATUS_CONFIG = {
  improving: { icon: "↗️", label: "Improving", color: "text-green-600" },
  recovering: { icon: "➡️", label: "Recovering", color: "text-blue-600" },
  declining: { icon: "↘️", label: "Declining", color: "text-red-600" },
  same: { icon: "➖", label: "Same", color: "text-amber-600" },
} as const;

const SENTIMENT_CONFIG = {
  positive: { emoji: "😊", label: "Positive" },
  neutral: { emoji: "😐", label: "Neutral" },
  negative: { emoji: "😟", label: "Negative" },
} as const;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 px-2"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export function ContactOutcomeCard({
  ownerPhone,
  ownerEmail,
  callOutcomeData,
  callDuration,
}: ContactOutcomeCardProps) {
  const recoveryStatus = callOutcomeData?.pet_recovery_status
    ? RECOVERY_STATUS_CONFIG[
        callOutcomeData.pet_recovery_status as keyof typeof RECOVERY_STATUS_CONFIG
      ]
    : null;

  const sentiment = callOutcomeData?.owner_sentiment
    ? SENTIMENT_CONFIG[
        callOutcomeData.owner_sentiment as keyof typeof SENTIMENT_CONFIG
      ]
    : null;

  const hasOutcome = recoveryStatus ?? sentiment ?? callDuration;

  return (
    <Card className="border-border/40">
      <div className="space-y-3 p-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {ownerPhone && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">{ownerPhone}</span>
              </div>
              <CopyButton text={ownerPhone} label="phone number" />
            </div>
          )}

          {ownerEmail && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="truncate font-medium">{ownerEmail}</span>
              </div>
              <CopyButton text={ownerEmail} label="email address" />
            </div>
          )}

          {!ownerPhone && !ownerEmail && (
            <p className="text-muted-foreground text-sm">
              No contact information available
            </p>
          )}
        </div>

        {/* Call Outcome */}
        {hasOutcome && (
          <>
            <div className="border-border/40 border-t" />
            <div className="space-y-2">
              {(recoveryStatus ?? sentiment) && (
                <div className="flex items-center gap-2 text-sm">
                  {recoveryStatus && (
                    <span
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        recoveryStatus.color,
                      )}
                    >
                      <span>{recoveryStatus.icon}</span>
                      <span>{recoveryStatus.label}</span>
                    </span>
                  )}

                  {recoveryStatus && sentiment && (
                    <span className="text-muted-foreground">·</span>
                  )}

                  {sentiment && (
                    <span className="flex items-center gap-1 font-medium">
                      <span>{sentiment.emoji}</span>
                      <span>{sentiment.label}</span>
                    </span>
                  )}
                </div>
              )}

              {callDuration !== null && callDuration !== undefined && (
                <div className="text-muted-foreground text-sm">
                  Duration: {formatDuration(callDuration)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
