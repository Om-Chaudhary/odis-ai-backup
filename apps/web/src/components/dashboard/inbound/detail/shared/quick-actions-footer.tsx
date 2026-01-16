"use client";

import { Trash2, CheckCircle2, XCircle, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { useState } from "react";

type FooterVariant = "call" | "appointment" | "message";

interface QuickActionsFooterProps {
  variant: FooterVariant;
  phone?: string | null;
  status?: string;
  isSubmitting?: boolean;
  callerName?: string | null;
  // Call actions
  onDelete?: () => void;
  // Appointment actions
  onConfirm?: () => void;
  onReject?: () => void;
  // Message actions
  onMarkRead?: () => void;
  onResolve?: () => void;
}

/**
 * Sticky footer with quick action buttons - adapts based on variant and status
 */
export function QuickActionsFooter({
  variant,
  status,
  isSubmitting = false,
  callerName,
  onDelete,
  onConfirm,
  onReject,
  onMarkRead,
  onResolve,
}: QuickActionsFooterProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Delete confirmation flow
  if (showDeleteConfirm && onDelete) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Are you sure you want to delete this{" "}
          {variant === "call"
            ? "call"
            : variant === "appointment"
              ? "appointment"
              : "message"}
          {variant === "call" && callerName ? ` from ${callerName}` : ""}? This
          action cannot be undone and will permanently delete all associated
          data.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="min-w-0 flex-1"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="min-w-0 flex-1"
            onClick={onDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Confirm Delete
          </Button>
        </div>
      </div>
    );
  }

  // Render variant-specific actions
  switch (variant) {
    case "call":
      return (
        <div className="flex justify-center">
          {onDelete && (
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Call
            </Button>
          )}
        </div>
      );

    case "appointment":
      // Pending appointments show confirm/reject
      if (status === "pending") {
        return (
          <div className="flex gap-2">
            {onReject && (
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={onReject}
                disabled={isSubmitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
            {onConfirm && (
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={onConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm Appointment
              </Button>
            )}
          </div>
        );
      }
      // Confirmed/rejected appointments show delete
      return (
        <div className="flex justify-center">
          {onDelete && (
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      );

    case "message":
      // Resolved messages only show delete
      if (status === "resolved") {
        return (
          <div className="flex justify-center">
            {onDelete && (
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Message
              </Button>
            )}
          </div>
        );
      }
      // New/read messages show mark read + resolve
      return (
        <div className="flex gap-2">
          {status === "new" && onMarkRead && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onMarkRead}
              disabled={isSubmitting}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Mark Read
            </Button>
          )}
          {onResolve && (
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={onResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Resolved
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}
