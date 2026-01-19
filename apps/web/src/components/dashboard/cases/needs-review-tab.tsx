"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  X,
  Phone,
  Mail,
  Pencil,
  UserX,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/shared/ui/table";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";
import { Button } from "@odis-ai/shared/ui/button";
import { EmptyState } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";
import { api } from "~/trpc/client";
import Link from "next/link";
import type { CaseStatus } from "@odis-ai/shared/types";

interface CaseNeedingAttention {
  id: string;
  status: CaseStatus | null;
  created_at: string;
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null;
  patient: {
    id: string;
    name: string;
    owner_name: string | null;
    owner_phone: string | null;
    owner_email: string | null;
    species: string | null;
  };
  missingDischarge: boolean;
  missingSoap: boolean;
  missingContact: true;
  priority: number;
}

/**
 * NeedsReviewTab - Cases missing contact information
 *
 * Shows cases that cannot have discharge calls/emails sent
 * because they're missing phone or email contact information.
 * Provides inline editing to quickly add missing info.
 */
export function NeedsReviewTab() {
  const {
    data: cases,
    isLoading,
    refetch,
  } = api.dashboard.getCasesNeedingAttention.useQuery({ limit: 20 });

  const updatePatient = api.cases.updatePatientInfo.useMutation({
    onSuccess: () => {
      toast.success("Contact info updated");
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to update", { description: error.message });
    },
  });

  const handleUpdateContact = useCallback(
    async (
      patientId: string,
      field: "phone" | "email",
      value: string,
    ): Promise<void> => {
      await updatePatient.mutateAsync({
        patientId,
        ...(field === "phone" ? { ownerPhone: value } : { ownerEmail: value }),
      });
    },
    [updatePatient],
  );

  return (
    <div className="animate-tab-content space-y-6">
      {/* Header */}
      <div className="animate-card-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Needs Review
          </h2>
          <p className="text-sm text-slate-600">
            Cases missing contact information needed for discharge
            communications
          </p>
        </div>
        {cases && cases.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {cases.length} case{cases.length !== 1 ? "s" : ""} need attention
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="animate-card-in-delay-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        {isLoading ? (
          <NeedsReviewSkeleton />
        ) : !cases || cases.length === 0 ? (
          <NeedsReviewEmpty />
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50">
                <TableRow className="text-xs">
                  <TableHead className="h-10 w-[200px] pl-4 font-semibold text-slate-700">
                    Patient
                  </TableHead>
                  <TableHead className="h-10 w-[150px] font-semibold text-slate-700">
                    Owner
                  </TableHead>
                  <TableHead className="h-10 w-[180px] font-semibold text-slate-700">
                    Phone
                  </TableHead>
                  <TableHead className="h-10 w-[220px] font-semibold text-slate-700">
                    Email
                  </TableHead>
                  <TableHead className="h-10 w-[100px] font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="h-10 w-[80px] font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <NeedsReviewRow
                    key={caseItem.id}
                    caseItem={caseItem as CaseNeedingAttention}
                    onUpdateContact={handleUpdateContact}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual row with inline edit capability
 */
function NeedsReviewRow({
  caseItem,
  onUpdateContact,
}: {
  caseItem: CaseNeedingAttention;
  onUpdateContact: (
    patientId: string,
    field: "phone" | "email",
    value: string,
  ) => Promise<void>;
}) {
  const [editingField, setEditingField] = useState<"phone" | "email" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const missingPhone = !caseItem.patient.owner_phone;
  const missingEmail = !caseItem.patient.owner_email;

  const startEdit = useCallback(
    (field: "phone" | "email") => {
      setEditingField(field);
      setEditValue(
        field === "phone"
          ? (caseItem.patient.owner_phone ?? "")
          : (caseItem.patient.owner_email ?? ""),
      );
    },
    [caseItem.patient],
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingField || !editValue.trim()) return;

    setIsSaving(true);
    try {
      await onUpdateContact(
        caseItem.patient.id,
        editingField,
        editValue.trim(),
      );
      setEditingField(null);
      setEditValue("");
    } finally {
      setIsSaving(false);
    }
  }, [editingField, editValue, caseItem.patient.id, onUpdateContact]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void saveEdit();
      } else if (e.key === "Escape") {
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit],
  );

  return (
    <TableRow className="h-14 hover:bg-slate-50/50">
      {/* Patient */}
      <TableCell className="py-2 pl-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm leading-tight font-medium text-slate-900">
            {caseItem.patient.name}
          </span>
          <span className="text-xs text-slate-500">
            {caseItem.patient.species ?? "Unknown species"}
            {caseItem.type && ` • ${formatCaseType(caseItem.type)}`}
          </span>
        </div>
      </TableCell>

      {/* Owner */}
      <TableCell className="py-2 text-sm text-slate-700">
        {(() => {
          const ownerName = caseItem.patient.owner_name;
          if (
            !ownerName ||
            ownerName === "null" ||
            ownerName === "undefined" ||
            ownerName.trim() === ""
          ) {
            return <span className="text-slate-400">Unknown</span>;
          }
          return ownerName;
        })()}
      </TableCell>

      {/* Phone - Inline Edit */}
      <TableCell className="py-2">
        {editingField === "phone" ? (
          <div className="flex items-center gap-1">
            <input
              type="tel"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="(555) 555-5555"
              autoFocus
              disabled={isSaving}
              className="h-8 w-32 rounded border border-slate-300 px-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <button
              onClick={saveEdit}
              disabled={isSaving || !editValue.trim()}
              className="flex h-7 w-7 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-1.5">
            {missingPhone ? (
              <button
                onClick={() => startEdit("phone")}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Add phone
              </button>
            ) : (
              <>
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {caseItem.patient.owner_phone}
                </span>
                <button
                  onClick={() => startEdit("phone")}
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </TableCell>

      {/* Email - Inline Edit */}
      <TableCell className="py-2">
        {editingField === "email" ? (
          <div className="flex items-center gap-1">
            <input
              type="email"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="email@example.com"
              autoFocus
              disabled={isSaving}
              className="h-8 w-44 rounded border border-slate-300 px-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <button
              onClick={saveEdit}
              disabled={isSaving || !editValue.trim()}
              className="flex h-7 w-7 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-1.5">
            {missingEmail ? (
              <button
                onClick={() => startEdit("email")}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Add email
              </button>
            ) : (
              <>
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="max-w-36 truncate text-sm text-slate-700">
                  {caseItem.patient.owner_email}
                </span>
                <button
                  onClick={() => startEdit("email")}
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="py-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
            caseItem.status === "ongoing"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : caseItem.status === "draft"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-slate-200 bg-slate-50 text-slate-700",
          )}
        >
          {caseItem.status ?? "unknown"}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href={`/dashboard/cases/${caseItem.id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function formatCaseType(caseType: string | null): string {
  if (!caseType) return "";
  return caseType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NeedsReviewSkeleton() {
  return (
    <div className="space-y-1 p-4">
      <div className="mb-2 flex gap-4 border-b pb-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-4 w-[220px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <div className="w-[200px] space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[160px]" />
          <Skeleton className="h-6 w-[70px]" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

function NeedsReviewEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-8 w-8 text-emerald-600" />
      </div>
      <EmptyState
        icon={UserX}
        title="All set!"
        description="No cases are missing contact information. All cases can have discharge communications sent."
        size="sm"
        className="min-h-0"
      />
    </div>
  );
}
