"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Plus, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "~/components/ui/data-table";
import { getColumns } from "~/components/admin/users-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function UsersPage() {
  // Filter state
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Query users
  const {
    data: users,
    isLoading,
    refetch,
  } = api.users.listUsers.useQuery({ search: "" });

  // Delete mutation
  const deleteMutation = api.users.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter users based on selected role
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    if (roleFilter === "all") return users;

    return users.filter((user) => user.role === roleFilter);
  }, [users, roleFilter]);

  const handleClearFilters = () => {
    setRoleFilter("all");
  };

  const columns = getColumns({
    onDelete: (id: string, name: string) => void handleDelete(id, name),
    isDeleting: deleteMutation.isPending,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-[#31aba3] to-[#2a9a92] p-3 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              User Management
            </h1>
          </div>
          <p className="text-base text-slate-600">
            Manage user accounts and onboard new users
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30 transition-all hover:scale-105">
            <Plus className="h-5 w-5" />
            Add New User
          </Button>
        </Link>
      </div>

      {/* Users DataTable */}
      <Card className="rounded-xl border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200">
          <CardTitle className="text-xl text-slate-900">Users</CardTitle>
          <CardDescription className="text-slate-600">
            Browse and manage all user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#31aba3]" />
                <p className="text-sm text-slate-600">
                  Loading users...
                </p>
              </div>
            </div>
          ) : users && users.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredUsers}
              searchKey="name"
              searchPlaceholder="Search users..."
              filterComponent={
                <div className="flex items-center gap-3">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 w-[180px] border-slate-200 bg-white">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="veterinarian">Veterinarian</SelectItem>
                      <SelectItem value="vet_tech">Vet Tech</SelectItem>
                      <SelectItem value="practice_owner">Practice Owner</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                  {roleFilter !== "all" && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="h-10"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="rounded-full bg-gradient-to-br from-[#31aba3]/10 to-[#2a9a92]/5 p-8">
                <Users className="h-12 w-12 text-[#31aba3]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">No users found</h3>
                <p className="max-w-sm text-sm text-slate-600">
                  Get started by adding your first user
                </p>
              </div>
              <Link href="/admin/users/new">
                <Button className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30 transition-all hover:scale-105">
                  <Plus className="h-4 w-4" />
                  Add your first user
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
