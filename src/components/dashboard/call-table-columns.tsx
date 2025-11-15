"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CallDetailResponse } from "~/server/actions/retell";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatPhoneNumber } from "~/lib/utils/phone-formatting";
import { ArrowUpDown, ExternalLink, Phone } from "lucide-react";
import Link from "next/link";
import { formatDateInGroup, getDateGroup } from "~/lib/utils/date-grouping";

// Status badge colors
const STATUS_VARIANTS = {
  scheduled: "secondary",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
  initiated: "outline",
  ringing: "outline",
  in_progress: "outline",
} as const;

// Format duration for display
function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export const columns: ColumnDef<CallDetailResponse>[] = [
  {
    accessorKey: "patient.pet_name",
    id: "pet_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 font-semibold hover:bg-transparent"
        >
          Pet Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const call = row.original;
      const petName =
        call.patient?.pet_name ?? call.call_variables?.pet_name ?? "Unknown";

      return (
        <Link
          href={`/dashboard/calls/${call.id}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {petName}
        </Link>
      );
    },
  },
  {
    accessorKey: "patient.owner_name",
    id: "owner_name",
    header: "Owner",
    cell: ({ row }) => {
      const call = row.original;
      const ownerName =
        call.patient?.owner_name ?? call.call_variables?.owner_name ?? "-";

      return <span className="text-muted-foreground text-sm">{ownerName}</span>;
    },
  },
  {
    accessorKey: "phone_number",
    header: "Phone Number",
    cell: ({ row }) => {
      const call = row.original;
      const phone = call.patient?.owner_phone ?? call.phone_number;

      return (
        <span className="font-mono text-sm">{formatPhoneNumber(phone)}</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant =
        STATUS_VARIANTS[status as keyof typeof STATUS_VARIANTS] ?? "outline";

      return (
        <Badge variant={variant} className="capitalize">
          {String(status).replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "duration_seconds",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="text-sm">
          {formatDuration(row.getValue("duration_seconds"))}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const timestamp = row.getValue<string>("created_at");
      const group = getDateGroup(timestamp);

      return (
        <span className="text-muted-foreground text-sm">
          {formatDateInGroup(timestamp, group)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const call = row.original;

      return (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {call.patient && (
            <Link href={`/dashboard/calls/${call.id}`}>
              <Button size="sm" variant="ghost" className="gap-2">
                <Phone className="h-3 w-3" />
                <span className="sr-only">Call again</span>
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/calls/${call.id}`}>
            <Button size="sm" variant="ghost" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              View
            </Button>
          </Link>
        </div>
      );
    },
  },
];
