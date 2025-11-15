"use client";

import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Orb } from "~/components/ui/orb";
import type { CallDetailResponse } from "~/server/actions/retell";
import { formatPhoneNumber } from "~/lib/utils/phone-formatting";
import { getRelativeTime } from "~/lib/utils/date-grouping";
import { Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ActiveCallsSectionProps {
  calls: CallDetailResponse[];
}

const STATUS_COLORS = {
  initiated: "bg-blue-500",
  ringing: "bg-yellow-500",
  in_progress: "bg-green-500",
} as const;

const STATUS_LABELS = {
  initiated: "Initiating",
  ringing: "Ringing",
  in_progress: "In Progress",
} as const;

export function ActiveCallsSection({ calls }: ActiveCallsSectionProps) {
  if (calls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Phone className="w-5 h-5 text-primary" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <h2 className="text-lg font-semibold">
          Active Calls ({calls.length})
        </h2>
      </div>

      <div className="grid gap-3">
        {calls.map((call) => (
          <ActiveCallCard key={call.id} call={call} />
        ))}
      </div>
    </div>
  );
}

function ActiveCallCard({ call }: { call: CallDetailResponse }) {
  const statusColor =
    STATUS_COLORS[call.status as keyof typeof STATUS_COLORS] ?? "bg-gray-500";
  const statusLabel =
    STATUS_LABELS[call.status as keyof typeof STATUS_LABELS] ?? call.status;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x" />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Call info */}
          <div className="flex-1 space-y-3">
            {/* Pet name and owner */}
            <div>
              {call.patient ? (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {call.patient.pet_name}
                    <Badge variant="outline" className="text-xs font-normal">
                      Patient
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {call.patient.owner_name} •{" "}
                    {formatPhoneNumber(call.patient.owner_phone)}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">
                    {call.call_variables?.pet_name ?? "Unknown Pet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPhoneNumber(call.phone_number)}
                  </p>
                </div>
              )}
            </div>

            {/* Status and timestamp */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
                <span className="font-medium">{statusLabel}</span>
              </div>
              <span className="text-muted-foreground">
                Started {getRelativeTime(call.created_at)}
              </span>
              {call.duration_seconds && (
                <span className="text-muted-foreground">
                  Duration: {Math.floor(call.duration_seconds / 60)}m{" "}
                  {call.duration_seconds % 60}s
                </span>
              )}
            </div>

            {/* Additional info */}
            {call.patient && (
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {call.patient.vet_name && (
                  <div>
                    <span className="font-medium">Vet:</span> {call.patient.vet_name}
                  </div>
                )}
                {call.patient.clinic_name && (
                  <div>
                    <span className="font-medium">Clinic:</span> {call.patient.clinic_name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Visual indicator and actions */}
          <div className="flex flex-col items-end gap-3">
            {/* Animated orb indicator */}
            <div className="w-[60px] h-[60px]">
              <Orb
                colors={
                  call.status === "in_progress"
                    ? ["#22c55e", "#16a34a"]
                    : call.status === "ringing"
                      ? ["#eab308", "#ca8a04"]
                      : ["#3b82f6", "#2563eb"]
                }
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Link href={`/dashboard/calls/${call.id}`}>
                <Button size="sm" variant="outline" className="gap-2">
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse border effect */}
      <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-pulse pointer-events-none" />
    </Card>
  );
}
