/**
 * Transcript Procedures
 *
 * Procedures for managing call transcripts:
 * - Update display transcript
 * - Translate transcript
 * - Clean transcript
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { getUserWithClinic, hasCallAccess } from "./helpers";
import {
  updateDisplayTranscriptInput,
  translateTranscriptInput,
  cleanTranscriptInput,
} from "./schemas";

export const transcriptRouter = createTRPCRouter({
  /**
   * Update display transcript for a call
   * Allows overriding the actual transcript with a cleaned/edited version
   */
  updateDisplayTranscript: protectedProcedure
    .input(updateDisplayTranscriptInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const user = await getUserWithClinic(supabase, ctx.user.id);
      const clinic = await getClinicByUserId(ctx.user.id, supabase);

      const { data: call, error: fetchError } = await supabase
        .from("inbound_vapi_calls")
        .select("id, clinic_name, user_id")
        .eq("id", input.id)
        .single();

      if (fetchError || !call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      const access = hasCallAccess(
        user,
        clinic?.name ?? null,
        call.clinic_name,
        call.user_id,
        ctx.user.id,
      );

      if (!access) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this call",
        });
      }

      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update({
          display_transcript: input.displayTranscript,
          use_display_transcript: input.useDisplayTranscript,
        })
        .eq("id", input.id);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update display transcript: ${updateError.message}`,
        });
      }

      return {
        success: true,
        displayTranscript: input.displayTranscript,
        useDisplayTranscript: input.useDisplayTranscript,
      };
    }),

  /**
   * Translate transcript to English and generate summary
   */
  translateTranscript: protectedProcedure
    .input(translateTranscriptInput)
    .mutation(async ({ input }) => {
      try {
        const { translateTranscript } =
          await import("@odis-ai/integrations/ai");
        return await translateTranscript({ transcript: input.transcript });
      } catch (error) {
        console.error("[TRANSLATE_TRPC] Error translating transcript:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to translate transcript",
        });
      }
    }),

  /**
   * Clean up transcript by fixing transcription errors
   * Uses AI to correct misspellings, remove filler words, and fix proper nouns
   */
  cleanTranscript: protectedProcedure
    .input(cleanTranscriptInput)
    .mutation(async ({ input }) => {
      try {
        const { cleanTranscript } = await import("@odis-ai/integrations/ai");
        return await cleanTranscript({
          transcript: input.transcript,
          clinicName: input.clinicName,
          knowledgeBase: input.knowledgeBase,
        });
      } catch (error) {
        console.error(
          "[CLEAN_TRANSCRIPT_TRPC] Error cleaning transcript:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to clean transcript",
        });
      }
    }),
});
