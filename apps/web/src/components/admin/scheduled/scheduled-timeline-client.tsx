"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  addHours,
  isWithinInterval,
} from "date-fns";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  Clock,
  User,
  Play,
  X,
  CalendarClock,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/shared/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { api } from "~/trpc/client";

type StatusFilter =
  | "all"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";
type TypeFilter = "all" | "call" | "email";

interface ScheduledItem {
  id: string;
  type: "call" | "email";
  userId: string;
  userEmail: string | null;
  userName: string | null;
  scheduledFor: string | null;
  status: string;
  patientName: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  caseId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface TimeGroup {
  label: string;
  items: ScheduledItem[];
  isPast: boolean;
}

function groupByTime(items: ScheduledItem[]): TimeGroup[] {
  const now = new Date();
  const oneHourFromNow = addHours(now, 1);

  const overdue: ScheduledItem[] = [];
  const nextHour: ScheduledItem[] = [];
  const today: ScheduledItem[] = [];
  const tomorrow: ScheduledItem[] = [];
  const later: ScheduledItem[] = [];
  const unscheduled: ScheduledItem[] = [];

  for (const item of items) {
    if (!item.scheduledFor) {
      unscheduled.push(item);
      continue;
    }

    const scheduledDate = new Date(item.scheduledFor);

    if (
      isPast(scheduledDate) &&
      !isWithinInterval(scheduledDate, { start: now, end: oneHourFromNow })
    ) {
      overdue.push(item);
    } else if (
      isWithinInterval(scheduledDate, { start: now, end: oneHourFromNow })
    ) {
      nextHour.push(item);
    } else if (isToday(scheduledDate)) {
      today.push(item);
    } else if (isTomorrow(scheduledDate)) {
      tomorrow.push(item);
    } else {
      later.push(item);
    }
  }

  const result: TimeGroup[] = [];

  if (overdue.length > 0) {
    result.push({ label: "Overdue", items: overdue, isPast: true });
  }
  if (nextHour.length > 0) {
    result.push({ label: "Next Hour", items: nextHour, isPast: false });
  }
  if (today.length > 0) {
    result.push({ label: "Today", items: today, isPast: false });
  }
  if (tomorrow.length > 0) {
    result.push({ label: "Tomorrow", items: tomorrow, isPast: false });
  }
  if (later.length > 0) {
    result.push({ label: "Later", items: later, isPast: false });
  }
  if (unscheduled.length > 0) {
    result.push({ label: "Unscheduled", items: unscheduled, isPast: false });
  }

  return result;
}

function getStatusColor(status: string) {
  switch (status) {
    case "queued":
    case "ringing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in-progress":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "completed":
    case "sent":
      return "bg-green-100 text-green-700 border-green-200";
    case "failed":
      return "bg-red-100 text-red-700 border-red-200";
    case "cancelled":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "queued":
    case "ringing":
      return <Clock className="h-3 w-3" />;
    case "in-progress":
      return <Loader2 className="h-3 w-3 animate-spin" />;
    case "completed":
    case "sent":
      return <CheckCircle2 className="h-3 w-3" />;
    case "failed":
      return <XCircle className="h-3 w-3" />;
    case "cancelled":
      return <X className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
}

function ScheduledItemCard({
  item,
  onCancel,
  onReschedule,
  onTriggerNow,
}: {
  item: ScheduledItem;
  onCancel: (item: ScheduledItem) => void;
  onReschedule: (item: ScheduledItem) => void;
  onTriggerNow: (item: ScheduledItem) => void;
}) {
  const isActionable = item.status === "queued" || item.status === "ringing";

  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Type icon and main info */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              item.type === "call"
                ? "bg-teal-100 text-teal-600"
                : "bg-purple-100 text-purple-600",
            )}
          >
            {item.type === "call" ? (
              <Phone className="h-5 w-5" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">
                {item.ownerName ?? "Unknown Owner"}
              </span>
              <Badge
                variant="outline"
                className={cn("text-xs", getStatusColor(item.status))}
              >
                {getStatusIcon(item.status)}
                <span className="ml-1 capitalize">{item.status}</span>
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              {item.patientName && (
                <span className="flex items-center gap-1">
                  🐾 {item.patientName}
                </span>
              )}
              {item.type === "call" && item.ownerPhone && (
                <span>{item.ownerPhone}</span>
              )}
              {item.type === "email" && item.ownerEmail && (
                <span>{item.ownerEmail}</span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.userName ?? item.userEmail ?? "Unknown user"}
              </span>
              {item.scheduledFor && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(item.scheduledFor), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        {isActionable && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => onTriggerNow(item)}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => onReschedule(item)}
            >
              <CalendarClock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onCancel(item)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScheduledTimelineClient() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Dialogs
  const [cancelItem, setCancelItem] = useState<ScheduledItem | null>(null);
  const [rescheduleItem, setRescheduleItem] = useState<ScheduledItem | null>(
    null,
  );
  const [triggerItem, setTriggerItem] = useState<ScheduledItem | null>(null);
  const [newScheduledTime, setNewScheduledTime] = useState("");

  // API calls
  const utils = api.useUtils();

  const { data, isLoading, refetch } =
    api.admin.getClinicScheduledItems.useQuery({
      statusFilter,
      typeFilter,
      limit: 200,
    });

  const { data: stats } = api.admin.getStats.useQuery();

  const cancelMutation = api.admin.cancelScheduledItem.useMutation({
    onSuccess: () => {
      toast.success("Item cancelled successfully");
      void utils.admin.getClinicScheduledItems.invalidate();
      void utils.admin.getStats.invalidate();
      setCancelItem(null);
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });

  const rescheduleMutation = api.admin.rescheduleItem.useMutation({
    onSuccess: () => {
      toast.success("Item rescheduled successfully");
      void utils.admin.getClinicScheduledItems.invalidate();
      setRescheduleItem(null);
      setNewScheduledTime("");
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  const triggerMutation = api.admin.triggerImmediateExecution.useMutation({
    onSuccess: () => {
      toast.success("Execution triggered - item will be processed shortly");
      void utils.admin.getClinicScheduledItems.invalidate();
      setTriggerItem(null);
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to trigger: ${error.message}`);
    },
  });

  const handleCancel = useCallback((item: ScheduledItem) => {
    setCancelItem(item);
  }, []);

  const handleReschedule = useCallback((item: ScheduledItem) => {
    setRescheduleItem(item);
    if (item.scheduledFor) {
      // Format for datetime-local input
      const date = new Date(item.scheduledFor);
      const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
      setNewScheduledTime(formatted);
    }
  }, []);

  const handleTriggerNow = useCallback((item: ScheduledItem) => {
    setTriggerItem(item);
  }, []);

  const confirmCancel = useCallback(() => {
    if (cancelItem) {
      cancelMutation.mutate({ id: cancelItem.id, type: cancelItem.type });
    }
  }, [cancelItem, cancelMutation]);

  const confirmReschedule = useCallback(() => {
    if (rescheduleItem && newScheduledTime) {
      rescheduleMutation.mutate({
        id: rescheduleItem.id,
        type: rescheduleItem.type,
        newScheduledFor: new Date(newScheduledTime).toISOString(),
      });
    }
  }, [rescheduleItem, newScheduledTime, rescheduleMutation]);

  const confirmTrigger = useCallback(() => {
    if (triggerItem) {
      triggerMutation.mutate({ id: triggerItem.id, type: triggerItem.type });
    }
  }, [triggerItem, triggerMutation]);

  const timeGroups = useMemo(() => {
    if (!data?.items) return [];
    return groupByTime(data.items);
  }, [data?.items]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Scheduled Items
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage scheduled discharge calls and emails across your clinic
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700">{stats.totalQueued} queued</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm">
              <Loader2 className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700">
                {stats.totalInProgress} in progress
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700">
                {stats.totalCompleted} completed
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{stats.totalFailed} failed</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filters:</span>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TypeFilter)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="call">Calls Only</SelectItem>
              <SelectItem value="email">Emails Only</SelectItem>
            </SelectContent>
          </Select>

          {data && (
            <span className="ml-auto text-sm text-slate-500">
              {data.totalCount} items
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : timeGroups.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-500">
            <CalendarDays className="mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium">No scheduled items found</p>
            <p className="text-sm">Adjust filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-8">
            {timeGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-3 flex items-center gap-2">
                  <h2
                    className={cn(
                      "text-sm font-semibold tracking-wider uppercase",
                      group.isPast ? "text-red-600" : "text-slate-500",
                    )}
                  >
                    {group.label}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {group.items.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <ScheduledItemCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onCancel={handleCancel}
                      onReschedule={handleReschedule}
                      onTriggerNow={handleTriggerNow}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelItem} onOpenChange={() => setCancelItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel Scheduled {cancelItem?.type === "call" ? "Call" : "Email"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled {cancelItem?.type} to{" "}
              {cancelItem?.ownerName ?? "the recipient"}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={!!rescheduleItem}
        onOpenChange={() => setRescheduleItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reschedule {rescheduleItem?.type === "call" ? "Call" : "Email"}
            </DialogTitle>
            <DialogDescription>
              Choose a new date and time for this scheduled{" "}
              {rescheduleItem?.type}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newTime">New Schedule Time</Label>
            <Input
              id="newTime"
              type="datetime-local"
              value={newScheduledTime}
              onChange={(e) => setNewScheduledTime(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={!newScheduledTime || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trigger Now Dialog */}
      <AlertDialog
        open={!!triggerItem}
        onOpenChange={() => setTriggerItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Execute {triggerItem?.type === "call" ? "Call" : "Email"} Now?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will trigger immediate execution of this {triggerItem?.type}{" "}
              to {triggerItem?.ownerName ?? "the recipient"}. The item will be
              processed by the queue system shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTrigger}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={triggerMutation.isPending}
            >
              {triggerMutation.isPending ? "Triggering..." : "Execute Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
