import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { onboardingSchema } from "../schemas";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("onboarding");

/**
 * POST /api/onboarding/submit
 *
 * Stores user credentials collected during onboarding and marks onboarding as complete.
 * Uses service client to bypass RLS since users don't have org assignment yet.
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const authState = await auth();
    if (!authState.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = onboardingSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid onboarding data", {
        userId: authState.userId,
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const {
      idexxUsername,
      idexxPassword,
      idexxCompanyId,
      weaveUsername,
      weavePassword,
    } = validationResult.data;

    // Use service client to bypass RLS
    const supabase = await createServiceClient();

    // Update user record with credentials and mark onboarding complete
    const { data, error } = await supabase
      .from("users")
      .update({
        idexx_username: idexxUsername,
        idexx_password: idexxPassword,
        idexx_company_id: idexxCompanyId,
        weave_username: weaveUsername,
        weave_password: weavePassword,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", authState.userId)
      .select("id, email, onboarding_completed")
      .single();

    if (error) {
      logger.error("Failed to update user credentials", {
        userId: authState.userId,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to save credentials" },
        { status: 500 },
      );
    }

    logger.info("User onboarding completed", {
      userId: authState.userId,
      userDbId: data.id,
      email: data.email,
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      data: {
        onboarding_completed: data.onboarding_completed,
      },
    });
  } catch (error) {
    logger.error("Onboarding submission error", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
