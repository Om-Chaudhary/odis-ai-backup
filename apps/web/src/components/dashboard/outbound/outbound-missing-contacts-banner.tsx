"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

const STORAGE_KEY = "outbound-missing-contacts-dismissed";

interface OutboundMissingContactsBannerProps {
  count: number;
  onReviewClick: () => void;
  /** If true, auto-dismiss the toast (e.g., when user navigates to missing contacts view) */
  autoDismiss?: boolean;
}

/**
 * Check if the toast was dismissed today
 */
function isDismissedToday(): boolean {
  if (typeof window === "undefined") return false;
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (!dismissed) return false;

  const today = new Date().toDateString();
  return dismissed === today;
}

/**
 * Mark the toast as dismissed for today
 */
function markDismissed(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toDateString();
  localStorage.setItem(STORAGE_KEY, today);
}

/**
 * Missing Contacts Toast
 *
 * Shows a warning toast when cases have missing contact info.
 * Dismissal persists for the current day via localStorage.
 * Clicking "Review Now" navigates to the missing contacts view.
 */
export function OutboundMissingContactsBanner({
  count,
  onReviewClick,
  autoDismiss = false,
}: OutboundMissingContactsBannerProps) {
  const hasShownRef = useRef(false);
  const onReviewClickRef = useRef(onReviewClick);
  onReviewClickRef.current = onReviewClick;

  useEffect(() => {
    // Don't show if no cases, already shown this render, or dismissed today
    if (count === 0 || hasShownRef.current || isDismissedToday()) {
      return;
    }

    hasShownRef.current = true;

    const handleDismiss = () => {
      toast.dismiss("missing-contacts");
      markDismissed();
    };

    const handleReview = () => {
      handleDismiss();
      onReviewClickRef.current();
    };

    toast.custom(
      () => (
        <div className="flex w-[360px] items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-amber-900">
              {count} {count === 1 ? "case has" : "cases have"} missing contact
              info
            </p>
            <p className="text-xs text-amber-700">
              Review and update to ensure successful delivery
            </p>
            <button
              onClick={handleReview}
              className="mt-1 w-fit rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              Review Now
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-700"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      {
        id: "missing-contacts",
        duration: Infinity,
      },
    );
  }, [count]);

  // Auto-dismiss when requested
  useEffect(() => {
    if (autoDismiss) {
      toast.dismiss("missing-contacts");
      markDismissed();
    }
  }, [autoDismiss]);

  // This component doesn't render anything - it just manages the toast
  return null;
}
