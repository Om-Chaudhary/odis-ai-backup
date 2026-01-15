import { createClient } from "@odis-ai/data-access/db/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  // Handle error from Supabase (e.g., expired link)
  if (error_param) {
    console.error("Auth callback error from Supabase:", {
      error: error_param,
      description: error_description,
    });
    const errorMessage = encodeURIComponent(
      error_description ?? error_param ?? "Authentication failed",
    );
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${errorMessage}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error, data: sessionData } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback: Failed to exchange code for session:", {
        error: error.message,
        code: error.code,
        status: error.status,
      });
      const errorMessage = encodeURIComponent(error.message);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${errorMessage}`,
      );
    }

    // Determine redirect destination based on onboarding status
    let redirectTo = next;

    // Check if onboarding is complete (only if not already going to onboarding)
    if (!next.startsWith("/onboarding") && sessionData?.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", sessionData.user.id)
        .single();

      // Redirect to onboarding if not complete
      if (!profile?.onboarding_completed) {
        redirectTo = "/onboarding";
      }
    }

    const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${origin}${redirectTo}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
    } else {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // No code provided - redirect to error page
  console.error("Auth callback: No code parameter provided");
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=${encodeURIComponent("No authentication code provided")}`,
  );
}
