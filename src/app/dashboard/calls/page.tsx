"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Phone, PhoneOutgoing, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { fetchCalls } from "~/server/actions/retell";
import { toast } from "sonner";

interface Call {
  id: string;
  retell_call_id: string;
  agent_id: string;
  phone_number: string;
  phone_number_pretty: string | null;
  status: string;
  duration_seconds: number | null;
  created_at: string;
  call_variables: Record<string, string>;
}

const statusColors: Record<string, string> = {
  initiated: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  ringing: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  in_progress: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
  failed: "bg-red-500/10 text-red-700 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-700 border-gray-500/20",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const loadCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchCalls({
        status: selectedStatus as
          | "all"
          | "initiated"
          | "ringing"
          | "in_progress"
          | "completed"
          | "failed"
          | "cancelled",
        limit: 50,
        offset: 0,
      });

      if (result.success) {
        setCalls(result.data as Call[]);
      } else {
        toast.error("Failed to load calls", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to load calls", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    void loadCalls();
  }, [loadCalls]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 p-2">
              <Phone className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                Call Management
              </h1>
              <p className="text-base text-slate-600">
                View and manage all Retell AI calls
              </p>
            </div>
          </div>
          <Link href="/dashboard/calls/send">
            <Button className="bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white shadow-xl transition-all hover:scale-105 hover:from-[#2a9a92] hover:to-[#0d9488] hover:shadow-2xl hover:shadow-[#31aba3]/40">
              <PhoneOutgoing className="mr-2 h-4 w-4" />
              Send Call
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex gap-2">
            {[
              "all",
              "initiated",
              "ringing",
              "in_progress",
              "completed",
              "failed",
            ].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={
                  selectedStatus === status
                    ? "bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white"
                    : "border-slate-300 hover:bg-emerald-50"
                }
              >
                {status.replace("_", " ").charAt(0).toUpperCase() +
                  status.slice(1).replace("_", " ")}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call History Table */}
      <Card className="relative overflow-hidden border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
          }}
        />

        <CardHeader className="relative z-10 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Call History
          </CardTitle>
          <CardDescription className="text-slate-600">
            {calls.length} {calls.length === 1 ? "call" : "calls"} found
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-600">Loading calls...</span>
            </div>
          ) : calls.length === 0 ? (
            <div className="p-12 text-center">
              <Phone className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-semibold text-slate-700">
                No calls found
              </h3>
              <p className="mb-6 text-slate-500">
                Get started by sending your first call
              </p>
              <Link href="/dashboard/calls/send">
                <Button className="bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white">
                  <PhoneOutgoing className="mr-2 h-4 w-4" />
                  Send Call
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/60">
                  <TableHead className="font-semibold text-slate-700">
                    Phone Number
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Duration
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Date & Time
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Variables
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow
                    key={call.id}
                    className="border-slate-200/40 transition-colors hover:bg-emerald-50/30"
                  >
                    <TableCell className="font-mono text-slate-900">
                      {call.phone_number_pretty ?? call.phone_number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[call.status] ?? statusColors.initiated
                        }
                      >
                        {call.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(call.duration_seconds)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(call.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {Object.keys(call.call_variables || {}).length > 0 ? (
                        <div className="flex gap-1">
                          {Object.entries(call.call_variables)
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="bg-slate-100 text-xs text-slate-600"
                              >
                                {key}: {String(value).slice(0, 10)}
                                {String(value).length > 10 ? "..." : ""}
                              </Badge>
                            ))}
                          {Object.keys(call.call_variables).length > 2 && (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-xs text-slate-600"
                            >
                              +{Object.keys(call.call_variables).length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
