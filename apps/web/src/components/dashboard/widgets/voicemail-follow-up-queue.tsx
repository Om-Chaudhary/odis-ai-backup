"use client";

import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";
import {
  Voicemail,
  ChevronRight,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function VoicemailFollowUpQueue() {
  const { data, isLoading } = api.dashboard.getVoicemailQueue.useQuery(
    { limit: 5, hoursBack: 72 },
    {
      refetchInterval: 120000, // Refetch every 2 minutes
    },
  );

  if (isLoading) {
    return <VoicemailFollowUpQueueSkeleton />;
  }

  // Don't show if no voicemails
  if (!data || data.totalVoicemails === 0) {
    return null;
  }

  const hasUnresolved = data.needingAction > 0;

  return (
    <Card
      className={cn(
        "animate-card-in overflow-hidden rounded-xl border shadow-lg backdrop-blur-md",
        hasUnresolved
          ? "border-amber-200/40 bg-gradient-to-br from-amber-50/30 via-white/70 to-white/70 shadow-amber-500/5"
          : "border-green-200/40 bg-gradient-to-br from-green-50/30 via-white/70 to-white/70 shadow-green-500/5",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                hasUnresolved ? "bg-amber-100" : "bg-green-100",
              )}
            >
              <Voicemail
                className={cn(
                  "h-5 w-5",
                  hasUnresolved ? "text-amber-600" : "text-green-600",
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Voicemail Follow-Ups
              </CardTitle>
              <p className="text-sm text-slate-500">
                Last 72 hours - tracking owner callbacks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnresolved ? (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                {data.needingAction} need action
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-green-700"
              >
                All resolved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-50 p-2 text-center">
            <div className="text-lg font-semibold text-slate-800">
              {data.totalVoicemails}
            </div>
            <div className="text-xs text-slate-500">Total VMs</div>
          </div>
          <div
            className={cn(
              "rounded-lg p-2 text-center",
              hasUnresolved ? "bg-amber-50" : "bg-slate-50",
            )}
          >
            <div
              className={cn(
                "text-lg font-semibold",
                hasUnresolved ? "text-amber-700" : "text-slate-800",
              )}
            >
              {data.needingAction}
            </div>
            <div className="text-xs text-slate-500">Need Action</div>
          </div>
          <div className="rounded-lg bg-green-50 p-2 text-center">
            <div className="text-lg font-semibold text-green-700">
              {data.resolved}
            </div>
            <div className="text-xs text-slate-500">Resolved</div>
          </div>
        </div>

        {/* Voicemail List */}
        <div className="space-y-2">
          {data.voicemails.map((vm) => (
            <VoicemailItem key={vm.id} voicemail={vm} />
          ))}
        </div>

        {data.totalVoicemails > 5 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Link
              href="/dashboard/outbound?filter=voicemail"
              className="flex items-center justify-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              View all {data.totalVoicemails} voicemails
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VoicemailData {
  id: string;
  caseId: string;
  caseType: string;
  caseStatus: string;
  petName: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string | null;
  endedAt: string | null;
  duration: number | null;
  followUp: {
    emailSent: boolean;
    emailSentAt: string | null;
    callbackMade: boolean;
    callbackSuccessful: boolean;
  };
  needsAction: boolean;
}

function VoicemailItem({ voicemail }: { voicemail: VoicemailData }) {
  const hasPhone = !!voicemail.ownerPhone;
  const hasEmail = !!voicemail.ownerEmail;

  return (
    <Link
      href={`/dashboard/outbound/workflow/${voicemail.caseId}`}
      className="group flex items-center justify-between rounded-lg border border-slate-100 bg-white/50 p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-800">
            {voicemail.petName}
          </span>
          {voicemail.needsAction ? (
            <Badge
              variant="outline"
              className="shrink-0 border-amber-200 bg-amber-50 text-xs text-amber-700"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              Needs action
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="shrink-0 border-green-200 bg-green-50 text-xs text-green-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Resolved
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <span className="truncate">{voicemail.ownerName}</span>
          <span className="text-slate-300">•</span>
          {voicemail.endedAt && (
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(voicemail.endedAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        {/* Follow-up status */}
        <div className="mt-2 flex items-center gap-2">
          {voicemail.followUp.emailSent && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Mail className="h-3 w-3" />
              <span>Email sent</span>
            </div>
          )}
          {voicemail.followUp.callbackSuccessful && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Phone className="h-3 w-3" />
              <span>Callback successful</span>
            </div>
          )}
          {voicemail.followUp.callbackMade &&
            !voicemail.followUp.callbackSuccessful && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="h-3 w-3" />
                <span>Callback attempted</span>
              </div>
            )}
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {/* Quick actions */}
        {voicemail.needsAction && (
          <div className="flex items-center gap-1">
            {hasPhone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-green-50 hover:bg-green-100"
                title="Call owner"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `tel:${voicemail.ownerPhone}`;
                }}
              >
                <Phone className="h-4 w-4 text-green-600" />
              </Button>
            )}
            {hasEmail && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-blue-50 hover:bg-blue-100"
                title="Email owner"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `mailto:${voicemail.ownerEmail}`;
                }}
              >
                <Mail className="h-4 w-4 text-blue-600" />
              </Button>
            )}
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
    </Link>
  );
}

function VoicemailFollowUpQueueSkeleton() {
  return (
    <Card className="animate-pulse rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 via-white/70 to-slate-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
