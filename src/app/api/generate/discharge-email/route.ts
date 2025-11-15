import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { generateEmailSchema } from "~/lib/validators/discharge";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { htmlToPlainText } from "~/lib/resend/client";

/**
 * Authenticate user from either cookies (web app) or Authorization header (extension)
 */
async function authenticateRequest(request: NextRequest) {
  // Check for Authorization header (browser extension)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // Create a Supabase client with the token
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for token-based auth
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, supabase: null };
    }

    return { user, supabase };
  }

  // Fall back to cookie-based auth (web app)
  const user = await getUser();
  if (!user) {
    return { user: null, supabase: null };
  }

  const supabase = await createClient();
  return { user, supabase };
}

/**
 * Generate Discharge Email Content API Route
 *
 * POST /api/generate/discharge-email
 *
 * Generates email content (subject, HTML, text) from a discharge summary
 * for sending to pet owners.
 *
 * Request body:
 * {
 *   caseId: string (uuid)
 *   dischargeSummaryId?: string (uuid) - optional, will use latest if not provided
 * }
 *
 * Response:
 * {
 *   subject: string
 *   html: string
 *   text: string
 *   patientName: string
 *   ownerName: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate from either cookies or Authorization header
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { caseId, dischargeSummaryId } = validationResult.data;

    console.log("[GENERATE_EMAIL] Generating email content", {
      userId: user.id,
      caseId,
      dischargeSummaryId,
    });

    // Fetch case data with patient information
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select(
        `
        id,
        metadata,
        patients (
          id,
          name,
          species,
          breed,
          owner_name
        )
      `,
      )
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) {
      console.error("[GENERATE_EMAIL] Case not found", {
        caseId,
        error: caseError,
      });
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 },
      );
    }

    // Fetch discharge summary
    let query = supabase
      .from("discharge_summaries")
      .select("id, content, created_at")
      .eq("case_id", caseId);

    if (dischargeSummaryId) {
      query = query.eq("id", dischargeSummaryId);
    }

    const { data: summaries, error: summaryError } = await query
      .order("created_at", { ascending: false })
      .limit(1);

    if (summaryError || !summaries || summaries.length === 0) {
      console.error("[GENERATE_EMAIL] Discharge summary not found", {
        caseId,
        dischargeSummaryId,
        error: summaryError,
      });
      return NextResponse.json(
        { error: "Discharge summary not found for this case" },
        { status: 404 },
      );
    }

    const dischargeSummary = summaries[0];
    const patient = caseData.patients as unknown as {
      name?: string;
      species?: string;
      breed?: string;
      owner_name?: string;
    } | null;

    const patientName = patient?.name ?? "your pet";
    const ownerName = patient?.owner_name ?? "Pet Owner";
    const species = patient?.species ?? "pet";
    const breed = patient?.breed;

    // Generate email subject
    const subject = `Discharge Instructions for ${patientName}`;

    // Generate HTML email content
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 24px;
    }
    .patient-info {
      background-color: #F3F4F6;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 25px;
    }
    .patient-info p {
      margin: 5px 0;
      font-size: 14px;
    }
    .content {
      white-space: pre-wrap;
      font-size: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 12px;
      color: #6B7280;
    }
    .cta {
      background-color: #4F46E5;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Discharge Instructions</h1>
    </div>

    <p>Dear ${ownerName},</p>

    <div class="patient-info">
      <p><strong>Patient:</strong> ${patientName}</p>
      ${breed ? `<p><strong>Breed:</strong> ${breed}</p>` : ""}
      ${species ? `<p><strong>Species:</strong> ${species}</p>` : ""}
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <p>Thank you for trusting us with ${patientName}'s care. Please review the following discharge instructions carefully:</p>

    <div class="content">
${dischargeSummary.content}
    </div>

    <div style="margin-top: 30px; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #92400E;">⚠️ Important Reminder</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400E;">
        If you notice any concerning symptoms or have questions about ${patientName}'s recovery,
        please don't hesitate to contact us immediately.
      </p>
    </div>

    <div class="footer">
      <p>This email was sent by OdisAI on behalf of your veterinary clinic.</p>
      <p>Please do not reply to this email. Contact your veterinarian directly for questions.</p>
    </div>
  </div>
</body>
</html>
`;

    // Generate plain text version
    const text = htmlToPlainText(html);

    console.log("[GENERATE_EMAIL] Email content generated successfully", {
      caseId,
      patientName,
      contentLength: dischargeSummary.content.length,
    });

    return NextResponse.json({
      subject,
      html,
      text,
      patientName,
      ownerName,
      dischargeSummaryId: dischargeSummary.id,
    });
  } catch (error) {
    console.error("[GENERATE_EMAIL] Error generating email content:", error);

    return NextResponse.json(
      {
        error: "Failed to generate email content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
