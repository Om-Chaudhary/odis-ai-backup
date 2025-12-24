import {
  getSupabaseClient,
  logger,
  requireAuthSession,
} from "@odis-ai/extension/shared";
import type { Tables } from "@odis-ai/shared/types";

const odisLogger = logger.child("[ODIS]");

type SoapNote = Tables<"soap_notes">;

/**
 * Extract IDEXX consultation ID from current page URL
 */
const extractConsultationId = (): string | null => {
  // Match URLs like: https://us.idexxneo.com/consultations/view/309656
  const match = /\/consultations\/view\/(\d+)/.exec(window.location.href);
  return match ? match[1] : null;
};

/**
 * Fetches the SOAP note for the current consultation being viewed
 * If on a consultation page, fetches note for that specific case
 * Otherwise, fetches the last created note
 * @returns The SOAP note or null if none found
 * @throws Error if user is not authenticated
 */
const fetchLastSoapNote = async (): Promise<SoapNote | null> => {
  try {
    const supabase = getSupabaseClient();

    // Ensure user is authenticated
    const session = await requireAuthSession();

    // Try to get consultation ID from URL
    const consultationId = extractConsultationId();

    if (consultationId) {
      odisLogger.debug("Fetching SOAP note for consultation", {
        consultationId,
      });

      // Try to find the case by external_id (idexx-{id})
      const externalId = `idexx-${consultationId}`;

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("external_id", externalId)
        .maybeSingle();

      if (!caseError && caseData) {
        // Found the case, now get its SOAP note
        const { data: soapNote, error: soapError } = await supabase
          .from("soap_notes")
          .select("*")
          .eq("case_id", caseData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!soapError && soapNote) {
          odisLogger.info("Successfully fetched SOAP note for case", {
            caseId: caseData.id,
          });
          return soapNote;
        }
      }

      odisLogger.debug("No SOAP note found for consultation ID", {
        consultationId,
      });
    }

    // Fallback: Fetch the last created SOAP note for any case
    odisLogger.debug("Fetching last SOAP note for user", {
      userEmail: session.user.email,
    });

    const { data, error } = await supabase
      .from("soap_notes")
      .select("*, cases!inner(user_id)")
      .eq("cases.user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // If no notes found, return null instead of throwing
      if (error.code === "PGRST116") {
        odisLogger.debug("No SOAP notes found for user");
        return null;
      }
      throw error;
    }

    odisLogger.info("Successfully fetched SOAP note", { soapNoteId: data.id });
    return data;
  } catch (error) {
    odisLogger.error("Error fetching SOAP note", { error });
    throw error;
  }
};

/**
 * Formats a SOAP note into HTML for insertion into CKEditor
 */
const formatSoapNoteAsHtml = (soapNote: SoapNote): string => {
  const sections = [];

  if (soapNote.subjective) {
    sections.push(`${formatTextForHtml(soapNote.subjective)}`);
  }

  if (soapNote.objective) {
    sections.push(`${formatTextForHtml(soapNote.objective)}`);
  }

  if (soapNote.assessment) {
    sections.push(`${formatTextForHtml(soapNote.assessment)}`);
  }

  if (soapNote.plan) {
    sections.push(`${formatTextForHtml(soapNote.plan)}`);
  }

  if (soapNote.client_instructions) {
    sections.push(`${formatTextForHtml(soapNote.client_instructions)}`);
  }

  return sections.length > 0
    ? sections.join("")
    : "<p>No SOAP note content available.</p>";
};

/**
 * Formats text content for HTML insertion
 * Converts each line to a paragraph tag for proper CKEditor rendering
 */
const formatTextForHtml = (text: string): string => {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return lines.map((line) => `<p>${line}</p>`).join("");
};

/**
 * Fetch recent SOAP notes for the current authenticated user
 * Ordered by most recent first
 * Includes patient information for display
 */
const fetchRecentSoapNotes = async (limit = 5): Promise<SoapNote[]> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  const { data, error } = await supabase
    .from("soap_notes")
    .select("*, cases!inner(user_id, external_id, id, patients(name))")
    .eq("cases.user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // If none found, return empty list
    if (error.code === "PGRST116") return [];
    throw error;
  }

  return data ?? [];
};

export type { SoapNote };
export { fetchLastSoapNote, formatSoapNoteAsHtml, fetchRecentSoapNotes };
