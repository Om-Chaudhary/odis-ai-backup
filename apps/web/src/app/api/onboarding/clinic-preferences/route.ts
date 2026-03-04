import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { clinicPreferencesSchema } from "../schemas";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("clinic-preferences");

/**
 * POST /api/onboarding/clinic-preferences
 *
 * Saves clinic onboarding preferences (species, ER preferences, etc.).
 * Uses service client to bypass RLS since user may not have org yet.
 */
export async function POST(request: Request) {
  try {
    const authState = await auth();
    if (!authState.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = clinicPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid clinic preferences data", {
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

    // Get user ID from clerk_user_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", authState.userId)
      .single();

    if (userError || !user) {
      logger.error("User not found", {
        clerkUserId: authState.userId,
        error: userError?.message,
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert preferences (user_id is unique constraint effectively)
    const { data: existing } = await supabase
      .from("clinic_onboarding_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const payload = {
      user_id: user.id,
      clinic_email: d.clinicEmail ?? null,
      after_hours_greeting: d.afterHoursGreeting ?? null,
      species: d.species.length > 0 ? d.species : null,
      species_other: d.speciesOther ?? null,
      never_schedule_types: d.neverScheduleTypes ?? null,
      emergency_symptoms:
        d.emergencySymptoms.length > 0 ? d.emergencySymptoms : null,
      emergency_symptoms_other: d.emergencySymptomsOther ?? null,
      er_referral_preference: d.erReferralPreference ?? null,
      preferred_er_name: d.preferredErName ?? null,
      scheduling_instructions: d.schedulingInstructions ?? null,
      cancellation_handling: d.cancellationHandling ?? null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("clinic_onboarding_preferences")
        .update(payload)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase
        .from("clinic_onboarding_preferences")
        .insert(payload));
    }

    if (error) {
      logger.error("Failed to save clinic preferences", {
        userId: user.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 },
      );
    }

    logger.info("Clinic preferences saved", {
      userId: user.id,
      clerkUserId: authState.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Clinic preferences saved successfully",
    });
  } catch (error) {
    logger.error("Clinic preferences submission error", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
