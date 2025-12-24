"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Check, X, Phone, Mail, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/shared/ui/table";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";

interface NeedsReviewCase {
  id: string;
  patient: {
    name: string;
  };
  owner: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  caseType: string | null;
  timestamp: string;
}

interface OutboundNeedsReviewTableProps {
  cases: NeedsReviewCase[];
  isLoading: boolean;
  onUpdateContact: (
    caseId: string,
    field: "phone" | "email",
    value: string,
  ) => Promise<void>;
}

/**
 * Needs Review Table - Inline Edit
 *
 * Shows cases missing contact info with inline editing.
 * Columns: Patient | Owner | Phone (edit) | Email (edit) | Actions
 */
export function OutboundNeedsReviewTable({
  cases,
  isLoading,
  onUpdateContact,
}: OutboundNeedsReviewTableProps) {
  if (isLoading) {
    return <NeedsReviewSkeleton />;
  }

  if (cases.length === 0) {
    return <NeedsReviewEmpty />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow className="text-xs">
              <TableHead className="h-8 w-[200px] pl-3">Patient</TableHead>
              <TableHead className="h-8 w-[160px]">Owner</TableHead>
              <TableHead className="h-8 w-[180px]">Phone</TableHead>
              <TableHead className="h-8 w-[240px]">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((caseItem) => (
              <NeedsReviewRow
                key={caseItem.id}
                caseItem={caseItem}
                onUpdateContact={onUpdateContact}
              />
            ))}
          </TableBody>
        </Table>
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
  caseItem: NeedsReviewCase;
  onUpdateContact: (
    caseId: string,
    field: "phone" | "email",
    value: string,
  ) => Promise<void>;
}) {
  const [editingField, setEditingField] = useState<"phone" | "email" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const missingPhone = !caseItem.owner.phone;
  const missingEmail = !caseItem.owner.email;

  const startEdit = useCallback(
    (field: "phone" | "email") => {
      setEditingField(field);
      setEditValue(
        field === "phone"
          ? (caseItem.owner.phone ?? "")
          : (caseItem.owner.email ?? ""),
      );
    },
    [caseItem.owner],
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingField || !editValue.trim()) return;

    setIsSaving(true);
    try {
      await onUpdateContact(caseItem.id, editingField, editValue.trim());
      setEditingField(null);
      setEditValue("");
    } finally {
      setIsSaving(false);
    }
  }, [editingField, editValue, caseItem.id, onUpdateContact]);

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
    <TableRow className="h-11 hover:bg-neutral-50">
      {/* Patient */}
      <TableCell className="py-1.5 pl-3">
        <div className="flex flex-col gap-0">
          <span className="text-sm leading-tight font-medium">
            {caseItem.patient.name}
          </span>
          <span className="text-xs text-neutral-500">
            {formatCaseType(caseItem.caseType)}
          </span>
        </div>
      </TableCell>

      {/* Owner */}
      <TableCell className="py-1.5 text-sm">
        {caseItem.owner.name ?? (
          <span className="text-neutral-400">Unknown</span>
        )}
      </TableCell>

      {/* Phone - Inline Edit */}
      <TableCell className="py-1.5">
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
              className="h-7 w-28 rounded border border-neutral-300 px-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            <button
              onClick={saveEdit}
              disabled={isSaving || !editValue.trim()}
              className="flex h-6 w-6 items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-1.5">
            {missingPhone ? (
              <button
                onClick={() => startEdit("phone")}
                className="flex items-center gap-1 rounded border border-dashed border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:border-amber-400 hover:bg-amber-100"
              >
                <AlertTriangle className="h-3 w-3" />
                Add phone
              </button>
            ) : (
              <>
                <Phone className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-sm">{caseItem.owner.phone}</span>
                <button
                  onClick={() => startEdit("phone")}
                  className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}
      </TableCell>

      {/* Email - Inline Edit */}
      <TableCell className="py-1.5">
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
              className="h-7 w-44 rounded border border-neutral-300 px-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            <button
              onClick={saveEdit}
              disabled={isSaving || !editValue.trim()}
              className="flex h-6 w-6 items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-1.5">
            {missingEmail ? (
              <button
                onClick={() => startEdit("email")}
                className="flex items-center gap-1 rounded border border-dashed border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:border-amber-400 hover:bg-amber-100"
              >
                <AlertTriangle className="h-3 w-3" />
                Add email
              </button>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5 text-neutral-400" />
                <span className="max-w-40 truncate text-sm">
                  {caseItem.owner.email}
                </span>
                <button
                  onClick={() => startEdit("email")}
                  className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function formatCaseType(caseType: string | null): string {
  if (!caseType) return "-";
  return caseType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NeedsReviewSkeleton() {
  return (
    <div className="space-y-1 p-2">
      <div className="flex gap-3 border-b pb-1.5 pl-3">
        <Skeleton className="h-3 w-[200px]" />
        <Skeleton className="h-3 w-[160px]" />
        <Skeleton className="h-3 w-[180px]" />
        <Skeleton className="h-3 w-[240px]" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 pl-3">
          <div className="w-[200px] space-y-0.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-3 w-[140px]" />
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-6 w-[180px]" />
        </div>
      ))}
    </div>
  );
}

function NeedsReviewEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <Check className="mb-4 h-12 w-12 text-green-500" />
      <p className="text-lg font-medium text-neutral-900">All set!</p>
      <p className="text-sm text-neutral-500">
        No cases are missing contact information.
      </p>
    </div>
  );
}
