import type { Metadata } from "next";
import { Suspense } from "react";
import { DischargeCallsTriageClient } from "./client";

export const metadata: Metadata = {
  title: "Discharge Calls Triage | Admin | Odis AI",
  description: "Review and categorize pilot discharge calls",
};

export default function DischargeCallsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      }
    >
      <DischargeCallsTriageClient />
    </Suspense>
  );
}
