"use client";

import { DataTable } from "@odis-ai/shared/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@odis-ai/shared/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export interface SyncHistoryItem {
  id: string;
  clinic_id: string;
  sync_type: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  appointments_found: number | null;
  cases_created: number | null;
  cases_updated: number | null;
  cases_skipped: number | null;
  cases_deleted: number | null;
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
  clinicSlug: string;
}

export function SyncHistoryTable({
  data,
  isLoading,
  clinicSlug,
}: SyncHistoryTableProps) {
  const columns: ColumnDef<SyncHistoryItem>[] = [
    {
      accessorKey: "clinic",
      header: "Clinic",
      cell: ({ row }) => {
        const clinic = row.original.clinics;
        if (!clinic) return <span className="text-slate-400">—</span>;

        return (
          <Link
            href={`/dashboard/${clinicSlug}/admin/clinics/${clinic.id}`}
            className="font-medium text-slate-900 transition-colors hover:text-amber-700"
          >
            {clinic.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "sync_type",
      header: "Type",
      cell: ({ row }) => {
        const syncType = row.original.sync_type;
        if (!syncType) return <span className="text-slate-400">—</span>;

        // Infer "full" sync from having both backward and forward inbound operations
        // This is a temporary solution until we add a dedicated sync_type column
        const isFull = syncType === "full" || syncType === "bidirectional";

        const displayType = isFull ? "Full Sync" : syncType.replace("_", " ");

        const variantClass = isFull
          ? "bg-purple-100 text-purple-700 font-medium"
          : "";

        return (
          <Badge variant="outline" className={variantClass}>
            <span className="capitalize">{displayType}</span>
          </Badge>
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
        const found = row.original.appointments_found ?? 0;
        const created = row.original.cases_created ?? 0;
        const updated = row.original.cases_updated ?? 0;
        const deleted = row.original.cases_deleted ?? 0;

        if (found === 0 && created === 0 && updated === 0 && deleted === 0) {
          return <span className="text-sm text-slate-400">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {found > 0 && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5">
                Found: {found}
              </span>
            )}
            {created > 0 && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                Created: {created}
              </span>
            )}
            {updated > 0 && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                Updated: {updated}
              </span>
            )}
            {deleted > 0 && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                Deleted: {deleted}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Started",
      cell: ({ row }) => {
        const started = row.original.created_at;
        return (
          <span className="text-sm text-slate-500">
            {formatDistanceToNow(new Date(started), { addSuffix: true })}
          </span>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const started = new Date(row.original.created_at);
        const completed = row.original.updated_at
          ? new Date(row.original.updated_at)
          : null;

        if (!completed || row.original.status === "running")
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
    {
      accessorKey: "error_message",
      header: "Error",
      cell: ({ row }) => {
        const errorMessage = row.original.error_message;
        const status = row.original.status;

        if (!errorMessage || status !== "failed")
          return <span className="text-slate-400">—</span>;

        return (
          <div className="max-w-xs">
            <p className="truncate text-xs text-red-600" title={errorMessage}>
              {errorMessage}
            </p>
          </div>
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
