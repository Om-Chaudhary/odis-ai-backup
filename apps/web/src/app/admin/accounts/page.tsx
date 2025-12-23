"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Input } from "@odis-ai/ui/input";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/ui/table";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700",
  veterinarian: "bg-emerald-100 text-emerald-700",
  vet_tech: "bg-blue-100 text-blue-700",
  practice_owner: "bg-purple-100 text-purple-700",
  client: "bg-slate-100 text-slate-700",
};

export default function AccountsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = api.admin.listUsers.useQuery({
    page,
    pageSize,
    search: search || undefined,
    role: roleFilter
      ? (roleFilter as
          | "admin"
          | "veterinarian"
          | "vet_tech"
          | "practice_owner"
          | "client")
      : undefined,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const handleViewUser = (userId: string) => {
    router.push(`/admin/accounts/${userId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by email, name, or clinic..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="veterinarian">Veterinarian</SelectItem>
              <SelectItem value="vet_tech">Vet Tech</SelectItem>
              <SelectItem value="practice_owner">Practice Owner</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Users
            {data && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="py-8 text-center text-sm text-rose-600">
              Failed to load users: {error.message}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Test Mode</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {user.firstName
                              ? `${user.firstName} ${user.lastName ?? ""}`
                              : "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ROLE_COLORS[user.role ?? ""] ??
                            "bg-slate-100 text-slate-700"
                          }
                        >
                          {user.role?.replace("_", " ") ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {user.clinicName ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.testModeEnabled ? (
                          <Badge variant="outline" className="text-amber-600">
                            Enabled
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">Off</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUser(user.id);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1)
                      )
                    }
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No users found matching your filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
