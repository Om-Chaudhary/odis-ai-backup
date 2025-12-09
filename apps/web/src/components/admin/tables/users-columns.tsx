"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import {
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { Database } from "~/database.types";

// Type for the user row from database
export type User = Database["public"]["Tables"]["users"]["Row"];

interface GetColumnsOptions {
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}

const roleColorMap = {
  admin: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  veterinarian: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  vet_tech: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  practice_owner: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  client: "bg-gray-500/10 text-gray-700 border-gray-500/20",
};

const roleDisplayMap = {
  admin: "Admin",
  veterinarian: "Veterinarian",
  vet_tech: "Vet Tech",
  practice_owner: "Practice Owner",
  client: "Client",
};

export const getColumns = ({
  onDelete,
  isDeleting,
}: GetColumnsOptions): ColumnDef<User>[] => [
  {
    id: "name",
    accessorFn: (row) => {
      if (row.first_name && row.last_name) {
        return `${row.first_name} ${row.last_name}`;
      }
      return row.email ?? "Unknown";
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:text-foreground -ml-4 h-8 font-semibold hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const displayName =
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : (user.email ?? "Unknown");
      return <div className="text-foreground font-medium">{displayName}</div>;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:text-foreground -ml-4 h-8 font-semibold hover:bg-transparent"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-foreground">{row.getValue("email") ?? "N/A"}</div>
    ),
  },
  {
    accessorKey: "role",
    header: () => <div className="font-semibold">Role</div>,
    cell: ({ row }) => {
      const role = row.original.role;
      if (!role)
        return <span className="text-muted-foreground text-sm">N/A</span>;

      return (
        <Badge
          variant="outline"
          className={`font-normal ${roleColorMap[role] ?? ""}`}
        >
          {roleDisplayMap[role] ?? role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "clinic_name",
    header: () => <div className="font-semibold">Clinic</div>,
    cell: ({ row }) => {
      const clinicName = row.original.clinic_name;
      return (
        <div className="text-foreground text-sm">
          {clinicName ?? (
            <span className="text-muted-foreground/70 italic">Not set</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "onboarding_completed",
    header: () => <div className="text-center font-semibold">Onboarded</div>,
    cell: ({ row }) => {
      const isCompleted = row.original.onboarding_completed;
      return (
        <div className="flex justify-center">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
        </div>
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
          className="hover:text-foreground -ml-4 h-8 font-semibold hover:bg-transparent"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return (
        <div className="text-foreground text-sm">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right font-semibold">Actions</div>,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex justify-end gap-2">
          <Link href={`/admin/users/${user.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary h-9 w-9 opacity-0 transition-all group-hover:opacity-100"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onDelete(
                user.id,
                user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : (user.email ?? "this user"),
              )
            }
            disabled={isDeleting}
            className="hover:bg-destructive/10 hover:text-destructive h-9 w-9 opacity-0 transition-all group-hover:opacity-100"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      );
    },
  },
];
