"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Eye,
  Mail,
  Clock,
  MoreHorizontal,
  Send,
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
  queued: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function AdminEmailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialUserId = searchParams.get("userId") ?? "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState(initialUserId);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const pageSize = 20;

  const { data, isLoading, error, refetch } =
    api.admin.listScheduledEmails.useQuery({
      page,
      pageSize,
      search: search || undefined,
      status: statusFilter
        ? (statusFilter as
            | "queued"
            | "scheduled"
            | "sending"
            | "sent"
            | "failed"
            | "cancelled")
        : undefined,
      userId: userIdFilter || undefined,
      sortBy: "created_at",
      sortOrder: "desc",
    });

  const bulkCancelMutation = api.admin.bulkCancelDischarges.useMutation({
    onSuccess: (result) => {
      toast.success(`Cancelled ${result.cancelledCount} emails`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to cancel emails: ${error.message}`);
    },
  });

  const allEmailIds = useMemo(
    () => data?.emails.map((e) => e.id) ?? [],
    [data?.emails],
  );

  const allSelected =
    allEmailIds.length > 0 && selectedIds.length === allEmailIds.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allEmailIds);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkCancel = () => {
    setCancelDialogOpen(true);
  };

  const confirmBulkCancel = () => {
    bulkCancelMutation.mutate({
      callIds: [],
      emailIds: selectedIds,
    });
    setCancelDialogOpen(false);
  };

  const formatScheduledTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Scheduled Emails
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor and manage all discharge emails
          </p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-rose-900">
              {selectedIds.length} email{selectedIds.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkCancel}
                disabled={bulkCancelMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="relative min-w-[250px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search patient, owner, user, or email..."
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
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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

      {/* Emails Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Emails
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
              Failed to load emails: {error.message}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data && data.emails.length > 0 ? (
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
                    <TableHead>Patient/Owner</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User/Clinic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.emails.map((email) => (
                    <TableRow
                      key={email.id}
                      className={`hover:bg-slate-50 ${
                        selectedIds.includes(email.id) ? "bg-rose-50" : ""
                      }`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(email.id)}
                          onCheckedChange={() => handleSelectOne(email.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {email.patient?.name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {email.patient?.ownerName ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900">
                            {email.recipientName ?? "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {email.recipientEmail ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="max-w-[200px] truncate text-sm text-slate-900">
                          {email.subject ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900">
                            {email.user?.email ?? "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {email.user?.clinicName ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUS_COLORS[email.status ?? ""] ?? "bg-slate-100"
                          }
                        >
                          {email.status ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3 w-3" />
                          {formatScheduledTime(email.scheduledFor)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {email.sentAt ? (
                          <div className="flex items-center gap-1 text-sm text-emerald-600">
                            <Send className="h-3 w-3" />
                            {formatScheduledTime(email.sentAt)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
                              onClick={() =>
                                router.push(`/admin/cases/${email.caseId}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Case
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() => {
                                setSelectedIds([email.id]);
                                setCancelDialogOpen(true);
                              }}
                              disabled={
                                email.status === "sent" ||
                                email.status === "cancelled"
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
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
              No emails found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Emails</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel {selectedIds.length} email
              {selectedIds.length > 1 ? "s" : ""}? This will prevent the emails
              from being sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Emails</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkCancel}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Cancel Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
