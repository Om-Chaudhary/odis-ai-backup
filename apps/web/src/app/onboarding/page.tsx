import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "~/components/onboarding/onboarding-wizard";
import { createServiceClient } from "@odis-ai/data-access/db/server";

/**
 * Onboarding Page
 *
 * Multi-step form for new users to provide:
 * - IDEXX Neo credentials
 * - Weave credentials
 *
 * After completion, users are redirected to /pending to await admin approval.
 */
export default async function OnboardingPage() {
  const authState = await auth();

  // Must be authenticated
  if (!authState.userId) {
    redirect("/sign-in");
  }

  // Check if user already completed onboarding
  const supabase = await createServiceClient();
  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed, clerk_user_id")
    .eq("clerk_user_id", authState.userId)
    .single();

  // If already completed, redirect to pending or dashboard
  if (userData?.onboarding_completed) {
    // If user has an org, redirect to dashboard, otherwise to pending
    if (authState.orgId) {
      redirect("/dashboard");
    } else {
      redirect("/pending");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">
            Welcome to ODIS AI
          </h1>
          <p className="text-lg text-slate-600">
            Let's get your account set up in just a few steps
          </p>
        </div>

        {/* Wizard */}
        <div className="rounded-xl bg-white p-8 shadow-lg md:p-12">
          <OnboardingWizard />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@odis-ai.com"
              className="text-teal-600 underline hover:text-teal-700"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
