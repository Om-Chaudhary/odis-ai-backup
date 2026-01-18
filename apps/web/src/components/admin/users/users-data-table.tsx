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
import { Avatar, AvatarFallback } from "@odis-ai/shared/ui/avatar";
import { MoreHorizontal, Eye, Shield, UserX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type User = Database["public"]["Tables"]["users"]["Row"];

interface UsersDataTableProps {
  data: User[];
  isLoading: boolean;
}

export function UsersDataTable({ data, isLoading }: UsersDataTableProps) {
  const router = useRouter();

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        const initials =
          [user.first_name, user.last_name]
            .filter(Boolean)
            .map((n) => n?.[0])
            .join("")
            .toUpperCase() || "?";

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-amber-100 text-sm text-amber-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                  "Unnamed User"}
              </span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge
            variant="outline"
            className={
              role === "admin"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "capitalize"
            }
          >
            {role === "admin" && <Shield className="mr-1 h-3 w-3" />}
            {role ?? "staff"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "clinic_name",
      header: "Clinic",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.clinic_name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined",
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
        const user = row.original;

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
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement deactivate user
                  console.log("Deactivate user:", user.id);
                }}
                className="text-red-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate User
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
          <p className="text-sm text-slate-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <DataTable
        columns={columns}
        data={data}
        searchKey="email"
        searchPlaceholder="Search users..."
      />
    </div>
  );
}
