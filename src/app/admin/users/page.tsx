"use client";

import { api } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Loader2, Users as UsersIcon, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "~/components/ui/data-table";
import { Badge } from "~/components/ui/badge";
import type { RouterOutputs } from "~/trpc/client";

type User = RouterOutputs["users"]["listUsers"][number];

export default function UsersPage() {
  // Query users
  const { data: users, isLoading, refetch } = api.users.listUsers.useQuery({});

  // Delete mutation
  const deleteMutation = api.users.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete user");
    },
  });

  const handleDelete = async (id: string, email: string) => {
    if (
      confirm(
        `Are you sure you want to delete user "${email}"? This will remove them from both authentication and the database.`,
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-purple-500/10 text-purple-500",
    veterinarian: "bg-blue-500/10 text-blue-500",
    vet_tech: "bg-green-500/10 text-green-500",
    practice_owner: "bg-orange-500/10 text-orange-500",
    client: "bg-gray-500/10 text-gray-500",
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </span>
          <span className="text-muted-foreground text-xs">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return role ? (
          <Badge variant="secondary" className={roleColors[role] ?? ""}>
            {String(role).replace("_", " ")}
          </Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "clinic_name",
      header: "Clinic",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.clinic_name ?? "N/A"}</span>
      ),
    },
    {
      accessorKey: "license_number",
      header: "License",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.license_number ?? "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/users/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1.5"
            onClick={() =>
              void handleDelete(row.original.id, row.original.email ?? "user")
            }
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <UsersIcon className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
          </div>
          <p className="text-muted-foreground text-base">
            View and manage user accounts
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> User creation requires Supabase Auth Admin
            API integration. To create new users, please use the Supabase
            dashboard directly for now.
          </p>
        </CardContent>
      </Card>

      {/* Users DataTable */}
      <Card className="rounded-xl bg-transparent shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Users</CardTitle>
          <CardDescription>Browse and manage all user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Loading users...
                </p>
              </div>
            </div>
          ) : users && users.length > 0 ? (
            <DataTable
              columns={columns}
              data={users}
              searchKey="email"
              searchPlaceholder="Search by email or name..."
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="bg-muted rounded-full p-8">
                <UsersIcon className="text-muted-foreground h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No users found</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                  No users in the system yet
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
