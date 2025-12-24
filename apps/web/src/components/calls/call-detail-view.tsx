"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Clock,
  FileText,
  Play,
  Pause,
  DollarSign,
  Activity,
  Dog,
  Cat,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Separator } from "@odis-ai/shared/ui/separator";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import { DischargeStatusBadge } from "~/components/dashboard/discharges/discharge-status-badge";
import type { CallDetails } from "@odis-ai/shared/types";
import { cn } from "@odis-ai/shared/util";

interface CallDetailViewProps {
  initialCall: CallDetails;
}

export function CallDetailView({ initialCall }: CallDetailViewProps) {
  const [call] = useState<CallDetails>(initialCall);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Polling for active calls
  useEffect(() => {
    if (
      !call.status ||
      ["queued", "ringing", "in_progress"].includes(call.status)
    ) {
      const interval = setInterval(() => {
        // Refresh data logic would go here - for now we rely on page refresh or manual implementation
        // In a real app, we'd use Supabase Realtime or polling
        void router.refresh();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [call.status, router]);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const SpeciesIcon =
    call.patient?.species?.toLowerCase() === "feline" ? Cat : Dog;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1 pl-0">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Call Details</CardTitle>
                <DischargeStatusBadge status={call.status} type="call" />
              </div>
              <CardDescription className="flex items-center gap-4 text-sm">
                {call.patient && (
                  <span className="flex items-center gap-1.5">
                    <SpeciesIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-foreground font-medium">
                      {call.patient.name}
                    </span>
                    <span className="text-muted-foreground">
                      ({call.patient.owner_name})
                    </span>
                  </span>
                )}
                {call.customer_phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {call.customer_phone}
                  </span>
                )}
              </CardDescription>
            </div>

            <div className="text-muted-foreground flex flex-col items-end gap-2 text-sm">
              {call.scheduled_for && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Scheduled: {format(new Date(call.scheduled_for), "PPp")}
                  </span>
                </div>
              )}
              {call.started_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Started: {format(new Date(call.started_at), "PPp")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Left Column */}
        <div className="space-y-6 md:col-span-2">
          {/* Analysis Summary */}
          {call.status === "completed" && call.call_analysis?.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Call Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {call.call_analysis.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {call.transcript && (
            <Card className="flex h-[500px] flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                <ScrollArea className="h-full pr-4">
                  <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {call.transcript}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Call Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>Duration</span>
                </div>
                <span className="font-medium">
                  {call.duration_seconds
                    ? `${Math.round(call.duration_seconds)}s`
                    : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span>Cost</span>
                </div>
                <span className="font-medium">
                  {call.cost ? `$${call.cost.toFixed(4)}` : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="text-muted-foreground h-4 w-4" />
                  <span>Sentiment</span>
                </div>
                <span className="font-medium capitalize">
                  {call.call_analysis?.sentiment ?? "-"}
                </span>
              </div>
              {call.call_analysis?.successEvaluation !== undefined && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                      <span>Success</span>
                    </div>
                    <span
                      className={cn(
                        "font-medium capitalize",
                        call.call_analysis.successEvaluation === "true" ||
                          call.call_analysis.successEvaluation === true ||
                          call.call_analysis.successEvaluation === "success"
                          ? "text-green-600"
                          : "text-amber-600",
                      )}
                    >
                      {typeof call.call_analysis.successEvaluation === "boolean"
                        ? call.call_analysis.successEvaluation
                          ? "Success"
                          : "Failed"
                        : String(
                            call.call_analysis.successEvaluation ?? "Unknown",
                          )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recording Player */}
          {call.recording_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <audio
                    ref={audioRef}
                    src={call.recording_url}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={toggleAudio}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Play Recording
                      </>
                    )}
                  </Button>
                  <a
                    href={call.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground text-center text-xs hover:underline"
                  >
                    Download / Open in new tab
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failure Reason */}
          {call.status === "failed" && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
                  <XCircle className="h-4 w-4" />
                  Failure Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {call.ended_reason ?? "Unknown error"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
