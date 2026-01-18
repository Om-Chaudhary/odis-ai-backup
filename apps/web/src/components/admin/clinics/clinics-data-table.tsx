"use client";

import { useRouter } from "next/navigation";
import type { Database } from "@odis-ai/shared/types";
import { DataTable } from "@odis-ai/shared/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { MoreHorizontal, Eye, Edit, Power } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicsDataTableProps {
  data: Clinic[];
  isLoading: boolean;
}

export function ClinicsDataTable({ data, isLoading }: ClinicsDataTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Clinic>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const clinic = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{clinic.name}</span>
            <span className="text-xs text-slate-500">{clinic.slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "pims_type",
      header: "PIMS",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono uppercase">
          {row.original.pims_type}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_active ? "default" : "secondary"}
          className={
            row.original.is_active
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-500"
          }
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const clinic = row.original;
        return (
          <div className="flex flex-col text-sm">
            {clinic.email && (
              <span className="text-slate-700">{clinic.email}</span>
            )}
            {clinic.phone && (
              <span className="text-slate-500">{clinic.phone}</span>
            )}
            {!clinic.email && !clinic.phone && (
              <span className="text-slate-400">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.timezone ?? "America/New_York"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">
          {formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const clinic = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/admin/clinics/${clinic.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/clinics/${clinic.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement toggle active status
                  console.log("Toggle active:", clinic.id);
                }}
                className="text-orange-600"
              >
                <Power className="mr-2 h-4 w-4" />
                {clinic.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">Loading clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search clinics..."
      />
    </div>
  );
}
