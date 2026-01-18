"use client";

import { DataTable } from "@odis-ai/shared/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@odis-ai/shared/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface SyncHistoryItem {
  id: string;
  clinic_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  inbound_cases_created: number | null;
  inbound_cases_updated: number | null;
  discharge_cases_updated: number | null;
  error_message: string | null;
  clinics: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface SyncHistoryTableProps {
  data: SyncHistoryItem[];
  isLoading: boolean;
}

export function SyncHistoryTable({ data, isLoading }: SyncHistoryTableProps) {
  const columns: ColumnDef<SyncHistoryItem>[] = [
    {
      accessorKey: "clinic",
      header: "Clinic",
      cell: ({ row }) => {
        const clinic = row.original.clinics;
        if (!clinic) return <span className="text-slate-400">—</span>;

        return (
          <Link
            href={`/admin/clinics/${clinic.id}`}
            className="font-medium text-slate-900 transition-colors hover:text-amber-700"
          >
            {clinic.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isCompleted = status === "completed";
        const isFailed = status === "failed" || status === "error";

        return (
          <Badge
            variant={
              isCompleted ? "default" : isFailed ? "destructive" : "secondary"
            }
            className={`flex w-fit items-center gap-1 ${
              isCompleted
                ? "bg-emerald-100 text-emerald-700"
                : isFailed
                  ? "bg-red-100 text-red-700"
                  : ""
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : isFailed ? (
              <XCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "stats",
      header: "Results",
      cell: ({ row }) => {
        const created = row.original.inbound_cases_created ?? 0;
        const updated = row.original.inbound_cases_updated ?? 0;
        const discharge = row.original.discharge_cases_updated ?? 0;

        if (created === 0 && updated === 0 && discharge === 0) {
          return <span className="text-sm text-slate-400">—</span>;
        }

        return (
          <div className="text-sm text-slate-600">
            {created > 0 && <span className="mr-2">Created: {created}</span>}
            {updated > 0 && <span className="mr-2">Updated: {updated}</span>}
            {discharge > 0 && <span>Discharge: {discharge}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "completed_at",
      header: "Completed",
      cell: ({ row }) => {
        const completed = row.original.completed_at;
        if (!completed)
          return <span className="text-sm text-slate-400">—</span>;

        return (
          <span className="text-sm text-slate-500">
            {formatDistanceToNow(new Date(completed), { addSuffix: true })}
          </span>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const started = new Date(row.original.started_at);
        const completed = row.original.completed_at
          ? new Date(row.original.completed_at)
          : null;

        if (!completed)
          return <span className="text-sm text-slate-400">—</span>;

        const duration = Math.round(
          (completed.getTime() - started.getTime()) / 1000,
        );
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        return (
          <span className="text-sm text-slate-600">
            {minutes > 0 && `${minutes}m `}
            {seconds}s
          </span>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">Loading sync history...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center">
        <Clock className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-sm text-slate-500">No sync history available</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}
