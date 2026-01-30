"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@odis-ai/shared/ui";

interface CompletionStepProps {
  onContinue: () => void;
}

/**
 * Step 3: Completion
 *
 * Shows success message after onboarding is complete.
 * Redirects user to pending approval page.
 */
export function CompletionStep({ onContinue }: CompletionStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Setup Complete!</h2>
        <p className="mt-2 text-slate-600">
          Thank you for providing your credentials. Your account is now ready
          for review.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-left">
        <h3 className="mb-3 font-semibold text-slate-900">
          Credentials Saved:
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>IDEXX Neo account</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Weave account</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
        <h3 className="mb-2 font-semibold text-blue-900">What's Next?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Our team will review your application</li>
          <li>• You'll be assigned to your clinic organization</li>
          <li>• You'll receive an email when your account is activated</li>
        </ul>
      </div>

      <Button onClick={onContinue} size="lg" className="w-full sm:w-auto">
        Continue to Dashboard
      </Button>
    </div>
  );
}
