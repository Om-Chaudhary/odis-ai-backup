"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Mail,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { EmailStatus } from "~/types/dashboard";

function getStatusBadge(status: EmailStatus) {
  if (status === "sent") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Sent
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        <AlertCircle className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (status === "queued") {
    return (
      <Badge
        variant="outline"
        className="border-slate-200 bg-slate-50 text-slate-700"
      >
        <Clock className="mr-1 h-3 w-3" />
        Queued
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        <XCircle className="mr-1 h-3 w-3" />
        Cancelled
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-slate-200 text-slate-600">
      {status ?? "Unknown"}
    </Badge>
  );
}

type StatusFilter = "all" | "queued" | "sent" | "failed" | "cancelled";

export function EmailHistory() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isFetching } =
    api.dashboard.getEmailHistory.useQuery({
      page,
      pageSize: 20,
      statusFilter,
    });

  const handleRowClick = (caseId: string | null) => {
    if (caseId) {
      router.push(`/dashboard/cases/${caseId}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !data?.emails.length ? (
          <div className="py-8 text-center text-slate-500">
            No emails found matching your filters
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Patient</TableHead>
                    <TableHead className="w-[150px]">Owner</TableHead>
                    <TableHead className="w-[200px]">Recipient</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[200px]">Subject</TableHead>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.emails.map((email) => (
                    <TableRow
                      key={email.id}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${!email.caseId ? "opacity-60" : ""}`}
                      onClick={() => handleRowClick(email.caseId)}
                    >
                      <TableCell className="font-medium">
                        {email.patientName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {email.ownerName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex flex-col">
                          <span className="truncate text-sm">
                            {email.recipientEmail}
                          </span>
                          {email.recipientName && (
                            <span className="truncate text-xs text-slate-400">
                              {email.recipientName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell className="text-slate-600">
                        <span className="line-clamp-1 text-sm">
                          {email.subject}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex flex-col">
                          <span className="text-xs">
                            {email.sentAt
                              ? format(new Date(email.sentAt), "MMM d, h:mm a")
                              : email.createdAt
                                ? format(
                                    new Date(email.createdAt),
                                    "MMM d, h:mm a",
                                  )
                                : "—"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {email.sentAt
                              ? formatDistanceToNow(new Date(email.sentAt), {
                                  addSuffix: true,
                                })
                              : email.createdAt
                                ? formatDistanceToNow(
                                    new Date(email.createdAt),
                                    { addSuffix: true },
                                  )
                                : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {email.caseId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View case"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/cases/${email.caseId}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data.pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Showing {(page - 1) * 20 + 1}-
                  {Math.min(page * 20, data.pagination.total)} of{" "}
                  {data.pagination.total} emails
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1),
                      )
                    }
                    disabled={page >= data.pagination.totalPages || isFetching}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
