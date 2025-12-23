"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  AlertCircle,
  Phone,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Input } from "@odis-ai/ui/input";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";
import { Checkbox } from "@odis-ai/ui/checkbox";
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
  DropdownMenuSeparator,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/ui/alert-dialog";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ongoing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-700",
  archived: "bg-amber-100 text-amber-700",
};

const DISCHARGE_STATUS_COLORS: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function AdminCasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from URL
  const initialUserId = searchParams.get("userId") ?? "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState(initialUserId);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "delete" | "complete" | "cancel" | null
  >(null);

  const pageSize = 20;

  const { data, isLoading, error, refetch } = api.admin.listAllCases.useQuery({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter
      ? (statusFilter as "ongoing" | "completed" | "cancelled" | "archived")
      : undefined,
    userId: userIdFilter || undefined,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const bulkDeleteMutation = api.admin.bulkDeleteCases.useMutation({
    onSuccess: (result) => {
      toast.success(`Deleted ${result.deletedCount} cases`);
      setSelectedIds([]);
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete cases: ${error.message}`);
    },
  });

  const bulkUpdateMutation = api.admin.bulkUpdateCases.useMutation({
    onSuccess: (result) => {
      toast.success(`Updated ${result.updatedCount} cases`);
      setSelectedIds([]);
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update cases: ${error.message}`);
    },
  });

  const allCaseIds = useMemo(
    () => data?.cases.map((c) => c.id) ?? [],
    [data?.cases],
  );

  const allSelected =
    allCaseIds.length > 0 && selectedIds.length === allCaseIds.length;

  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allCaseIds);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = () => {
    setBulkActionType("delete");
    setDeleteDialogOpen(true);
  };

  const handleBulkComplete = () => {
    bulkUpdateMutation.mutate({
      caseIds: selectedIds,
      updates: { status: "completed" },
    });
  };

  const handleBulkCancel = () => {
    bulkUpdateMutation.mutate({
      caseIds: selectedIds,
      updates: { status: "cancelled" },
    });
  };

  const confirmBulkAction = () => {
    if (bulkActionType === "delete") {
      bulkDeleteMutation.mutate({ caseIds: selectedIds });
    }
    setDeleteDialogOpen(false);
    setBulkActionType(null);
  };

  const handleViewCase = (caseId: string) => {
    router.push(`/admin/cases/${caseId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage all cases across all users
          </p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-rose-900">
              {selectedIds.length} case{selectedIds.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkComplete}
                disabled={bulkUpdateMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkCancel}
                disabled={bulkUpdateMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="relative min-w-[250px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search patient, owner, user, or case ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {userIdFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserIdFilter("");
                setPage(1);
              }}
            >
              Clear user filter
              <XCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Cases
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
              Failed to load cases: {error.message}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data && data.cases.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={someSelected ? "opacity-50" : ""}
                      />
                    </TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>User/Clinic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discharges</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cases.map((caseItem) => (
                    <TableRow
                      key={caseItem.id}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedIds.includes(caseItem.id) ? "bg-rose-50" : ""
                      }`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(caseItem.id)}
                          onCheckedChange={() => handleSelectOne(caseItem.id)}
                        />
                      </TableCell>
                      <TableCell onClick={() => handleViewCase(caseItem.id)}>
                        <div className="flex items-center gap-2">
                          {caseItem.isStarred && (
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          )}
                          {caseItem.isUrgent && (
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {caseItem.patient?.name ?? "Unknown"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {caseItem.patient?.species ?? "—"}{" "}
                              {caseItem.patient?.breed
                                ? `• ${caseItem.patient.breed}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewCase(caseItem.id)}>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900">
                            {caseItem.patient?.ownerName ?? "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {caseItem.patient?.ownerPhone ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewCase(caseItem.id)}>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900">
                            {caseItem.user?.firstName
                              ? `${caseItem.user.firstName} ${caseItem.user.lastName ?? ""}`
                              : (caseItem.user?.email ?? "—")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {caseItem.user?.clinicName ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewCase(caseItem.id)}>
                        <Badge
                          className={
                            STATUS_COLORS[caseItem.status ?? ""] ??
                            "bg-slate-100"
                          }
                        >
                          {caseItem.status ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleViewCase(caseItem.id)}>
                        <div className="flex items-center gap-2">
                          {caseItem.callStatus && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  DISCHARGE_STATUS_COLORS[
                                    caseItem.callStatus
                                  ] ?? ""
                                }`}
                              >
                                {caseItem.callStatus}
                              </Badge>
                            </div>
                          )}
                          {caseItem.emailStatus && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  DISCHARGE_STATUS_COLORS[
                                    caseItem.emailStatus
                                  ] ?? ""
                                }`}
                              >
                                {caseItem.emailStatus}
                              </Badge>
                            </div>
                          )}
                          {!caseItem.callStatus && !caseItem.emailStatus && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewCase(caseItem.id)}>
                        <span className="text-sm text-slate-500">
                          {new Date(caseItem.createdAt).toLocaleDateString()}
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
                                handleViewCase(caseItem.id);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                bulkUpdateMutation.mutate({
                                  caseIds: [caseItem.id],
                                  updates: { status: "completed" },
                                });
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                bulkUpdateMutation.mutate({
                                  caseIds: [caseItem.id],
                                  updates: { status: "cancelled" },
                                });
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIds([caseItem.id]);
                                setBulkActionType("delete");
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
                        Math.min(data.pagination.totalPages, p + 1),
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
              No cases found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.length} case
              {selectedIds.length > 1 ? "s" : ""} and all associated data
              including patients, discharge records, calls, and emails. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
