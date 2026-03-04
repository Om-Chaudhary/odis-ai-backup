import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { onboardingSchema } from "../schemas";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("onboarding");

/**
 * POST /api/onboarding/submit
 *
 * Stores PMS type, phone system type, and any credentials collected during onboarding.
 * Marks onboarding as complete.
 * Uses service client to bypass RLS since users don't have org assignment yet.
 *
 * Uses upsert to handle both new users (Clerk webhook hasn't fired yet)
 * and existing users in a single atomic operation.
 */
export async function POST(request: Request) {
  try {
    const authState = await auth();
    if (!authState.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const d = validationResult.data;
    const supabase = await createServiceClient();

    // Get Clerk user data for email/profile (best-effort)
    let email: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let avatarUrl: string | null = null;

    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        email =
          clerkUser.emailAddresses?.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ?? null;
        firstName = clerkUser.firstName ?? null;
        lastName = clerkUser.lastName ?? null;
        avatarUrl = clerkUser.imageUrl ?? null;
      }
    } catch (e) {
      logger.warn("Could not fetch Clerk user data for onboarding", {
        clerkUserId: authState.userId,
        error: e,
      });
    }

    // Build upsert payload — combines user creation + onboarding data
    const payload: Record<string, unknown> = {
      clerk_user_id: authState.userId,
      pims_type: d.pmsType,
      phone_system_type: d.phoneSystemType,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Only set profile fields if we have them (avoid overwriting existing with null)
    if (email) payload.email = email;
    if (firstName) payload.first_name = firstName;
    if (lastName) payload.last_name = lastName;
    if (avatarUrl) payload.avatar_url = avatarUrl;

    // PMS credentials
    if (d.pmsType === "idexx_neo") {
      payload.idexx_username = d.idexxUsername || null;
      payload.idexx_password = d.idexxPassword || null;
      payload.idexx_company_id = d.idexxCompanyId || null;
    } else {
      payload.pims_username = d.pmsUsername || null;
      payload.pims_password = d.pmsPassword || null;
    }

    // Phone system details
    if (d.phoneSystemType === "weave") {
      payload.weave_username = d.weaveUsername || null;
      payload.weave_password = d.weavePassword || null;
    } else {
      payload.phone_system_provider_name = d.phoneSystemProviderName || null;
      payload.phone_system_contact_info = d.phoneSystemContactInfo || null;
      payload.phone_system_details = d.phoneSystemDetails || null;
    }

    // Single atomic upsert — creates user if webhook hasn't fired yet,
    // otherwise updates the existing record with onboarding data
    const { data, error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "clerk_user_id" })
      .select("id, email, onboarding_completed")
      .single();

    if (error) {
      logger.error("Failed to save onboarding data", {
        userId: authState.userId,
        error: error.message,
        code: error.code,
      });
      return NextResponse.json(
        { error: "Failed to save onboarding data" },
        { status: 500 },
      );
    }

    logger.info("User onboarding completed", {
      userId: authState.userId,
      userDbId: data.id,
      email: data.email,
      pmsType: d.pmsType,
      phoneSystemType: d.phoneSystemType,
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
