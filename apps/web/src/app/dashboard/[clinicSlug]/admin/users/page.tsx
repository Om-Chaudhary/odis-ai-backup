"use client";

import { useState } from "react";
import type { Database } from "@odis-ai/shared/types";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { UsersDataTable } from "~/components/admin/users/users-data-table";
import { InviteUserDialog } from "~/components/admin/users/invite-user-dialog";
import { Plus, Search } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserRole =
  | "all"
  | "veterinarian"
  | "vet_tech"
  | "admin"
  | "practice_owner"
  | "client";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: queryData, isLoading } = api.admin.users.list.useQuery({
    search: search || undefined,
    role: role,
    limit: 50,
    offset: 0,
  });

  // Type assertion to break deep type inference chain
  const data = queryData as { users: User[]; total: number } | undefined;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">
            Manage platform users and permissions
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[300px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={role}
            onValueChange={(value: UserRole) => setRole(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="veterinarian">Veterinarian</SelectItem>
              <SelectItem value="vet_tech">Vet Tech</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="practice_owner">Practice Owner</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <UsersDataTable data={data?.users ?? []} isLoading={isLoading} />

      {/* Results count */}
      {data && (
        <div className="text-center text-sm text-slate-500">
          Showing {data.users.length} of {data.total} users
        </div>
      )}

      {/* Invite Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
