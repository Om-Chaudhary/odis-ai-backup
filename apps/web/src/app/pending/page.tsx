import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { Button } from "@odis-ai/shared/ui";
import { AutoSelectOrg } from "./auto-select-org";

/**
 * Pending Approval Page
 *
 * Shows a friendly message to users who have completed onboarding
 * but are waiting for admin to assign them to a clinic organization.
 */
export default async function PendingPage() {
  const authState = await auth();

  // Must be authenticated
  if (!authState.userId) {
    redirect("/sign-in");
  }

  // If user has an org, they should go to dashboard
  if (authState.orgId) {
    redirect("/dashboard");
  }

  // Check if user completed onboarding
  const supabase = await createServiceClient();
  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed, email")
    .eq("clerk_user_id", authState.userId)
    .single();

  // If not completed onboarding, redirect to onboarding
  if (!userData?.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      {/* Auto-select organization if user has one */}
      <AutoSelectOrg />
      <div className="w-full max-w-2xl">
        {/* Main card */}
        <div className="rounded-xl bg-white p-8 shadow-lg md:p-12">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-yellow-100 p-4">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              Welcome to ODIS AI! 🎉
            </h1>
            <p className="text-lg text-slate-600">
              Your account setup is complete and ready for review.
            </p>
          </div>

          {/* Status */}
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="mb-4 font-semibold text-slate-900">
              Credentials Stored:
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-slate-700">
                  IDEXX Neo account connected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-slate-700">Weave account connected</span>
              </div>
            </div>
          </div>

          {/* What's next */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-3 font-semibold text-blue-900">
              What happens next?
            </h2>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 font-bold text-blue-600">1.</span>
                <span>Our team is reviewing your application</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 font-bold text-blue-600">2.</span>
                <span>You'll be assigned to your clinic organization</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 font-bold text-blue-600">3.</span>
                <span>
                  You'll receive an email when your account is activated
                </span>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-600" />
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Questions or need help?
                </h3>
                <p className="mb-2 text-sm text-slate-600">
                  Our support team is here to assist you.
                </p>
                <a
                  href="mailto:support@odis-ai.com"
                  className="text-sm font-medium text-teal-600 underline hover:text-teal-700"
                >
                  support@odis-ai.com
                </a>
              </div>
            </div>
          </div>

          {/* Sign out button */}
          <div className="flex justify-center">
            <SignOutButton>
              <Button variant="outline" size="lg">
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Account activation typically takes 1-2 business days. We'll notify
            you at <span className="font-medium">{userData?.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
