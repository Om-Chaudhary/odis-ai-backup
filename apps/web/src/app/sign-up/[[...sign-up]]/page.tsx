import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServiceClient } from "@odis-ai/data-access/db/server";

/**
 * Sign Up Page
 *
 * Redirects authenticated users based on their state:
 * - Has org → /dashboard
 * - Completed onboarding, no org → /pending
 * - Not completed onboarding → /onboarding
 */
export default async function SignUpPage() {
  const authState = await auth();

  // If already authenticated, redirect based on state
  if (authState.userId) {
    // If user has an org, go to dashboard
    if (authState.orgId) {
      redirect("/dashboard");
    }

    // Check if user completed onboarding
    const supabase = await createServiceClient();
    const { data: userData } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("clerk_user_id", authState.userId)
      .single();

    // If not completed onboarding, redirect to onboarding
    if (!userData?.onboarding_completed) {
      redirect("/onboarding");
    }

    // Completed onboarding but no org, redirect to pending
    redirect("/pending");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-teal-950/80 backdrop-blur-sm border border-teal-800/50 shadow-2xl",
          },
        }}
      />
    </div>
  );
}
