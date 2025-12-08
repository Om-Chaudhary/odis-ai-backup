"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@odis/ui/button";
import { Badge } from "@odis/ui/badge";
import { Pencil, Trash2, Loader2, ArrowUpDown, Share2 } from "lucide-react";
import Link from "next/link";
import type { Database } from "~/database.types";

// Type for the SOAP template row from database
type SoapTemplateRow =
  Database["public"]["Tables"]["temp_soap_templates"]["Row"];

// Type for user fields returned from the join
type UserFields = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

// Combined type matching the tRPC query output
export type SoapTemplate = SoapTemplateRow & {
  user: UserFields | null;
};

interface GetColumnsOptions {
  onDelete: (id: string, name: string) => void;
  onShare: (id: string, name: string) => void;
  isDeleting: boolean;
}

export const getColumns = ({
  onDelete,
  onShare,
  isDeleting,
}: GetColumnsOptions): ColumnDef<SoapTemplate>[] => [
  {
    accessorKey: "template_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:text-foreground -ml-4 h-8 font-semibold hover:bg-transparent"
        >
          Template Name
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-foreground font-medium">
        {row.getValue("template_name")}
      </div>
    ),
  },
  {
    accessorKey: "display_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:text-foreground -ml-4 h-8 font-semibold hover:bg-transparent"
        >
          Display Name
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-foreground">{row.getValue("display_name")}</div>
    ),
  },
  {
    id: "assigned_user",
    accessorFn: (row) => {
      if (!row.user) return "Unassigned";
      if (row.user.first_name && row.user.last_name) {
        return `${row.user.first_name} ${row.user.last_name}`;
      }
      return row.user.email;
    },
    header: () => <div className="font-semibold">Assigned User</div>,
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) {
        return (
          <span className="text-muted-foreground/70 text-sm italic">
            Unassigned
          </span>
        );
      }
      const displayName =
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.email;
      return <span className="text-foreground text-sm">{displayName}</span>;
    },
  },
  {
    accessorKey: "is_default",
    header: () => <div className="font-semibold">Status</div>,
    cell: ({ row }) => {
      return row.getValue("is_default") ? (
        <Badge variant="secondary" className="font-normal">
          Default
        </Badge>
      ) : null;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right font-semibold">Actions</div>,
    cell: ({ row }) => {
      const template = row.original;

      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onShare(template.id, template.display_name)}
            className="h-9 w-9 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500"
          >
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
          <Link href={`/admin/templates/soap/${template.id}`}>
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
            onClick={() => onDelete(template.id, template.display_name)}
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
