import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Accept Invitation Page
 *
 * Landing page for users accepting organization invitations.
 * Clerk handles the invitation acceptance flow automatically.
 *
 * After accepting, users are redirected to the dashboard.
 */
export default async function AcceptInvitationPage() {
  const { userId, orgId } = await auth();

  // If user is already authenticated and in an org, redirect to dashboard
  if (userId && orgId) {
    redirect("/dashboard");
  }

  // If user is authenticated but not in an org yet,
  // Clerk will show the invitation acceptance UI
  if (userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Accept Invitation</h1>
          <p className="text-muted-foreground">
            Please check your Clerk account to accept the organization
            invitation.
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to sign in
  redirect("/sign-in?redirect_url=/accept-invitation");
}
