import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '~/lib/supabase/server';
import { isFutureTime } from '~/lib/utils/business-hours';
import { scheduleCallExecution } from '~/lib/qstash/client';
import { getUser } from '~/server/actions/auth';
import { createServerClient } from '@supabase/ssr';
import { env } from '~/env';
import type { DynamicVariables } from '~/lib/vapi/types';
import { buildDynamicVariables } from '~/lib/vapi/knowledge-base';

/**
 * Request body schema for scheduling a VAPI call
 */
interface ScheduleVapiCallRequest {
  // Customer information
  phoneNumber: string; // E.164 format
  petName: string;
  ownerName: string;

  // Clinic information
  clinicName: string;
  agentName: string; // Vet tech name
  clinicPhone: string; // Spelled out
  emergencyPhone?: string; // Spelled out

  // Appointment information
  appointmentDate: string; // Spelled out (e.g., "November eighth")
  callType: 'discharge' | 'follow-up';
  dischargeSummary: string;

  // Discharge-specific fields
  subType?: 'wellness' | 'vaccination';
  nextSteps?: string;

  // Follow-up specific fields
  condition?: string;
  conditionCategory?: string;
  medications?: string;
  recheckDate?: string;

  // Optional metadata
  petSpecies?: 'dog' | 'cat' | 'other';
  petAge?: number;
  petWeight?: number;
  daysSinceTreatment?: number;

  // Scheduling
  scheduledFor?: string; // ISO 8601 datetime string

  // Optional overrides
  assistantId?: string;
  phoneNumberId?: string;

  // Additional metadata
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authenticate user from either cookies (web app) or Authorization header (extension)
 */
async function authenticateRequest(request: NextRequest) {
  // Check for Authorization header (browser extension)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
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
      }
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
 * Schedule VAPI Call API Route
 *
 * POST /api/vapi/schedule
 *
 * Creates a scheduled call in the database and enqueues it in QStash
 * for delayed execution at the specified time.
 *
 * This endpoint is designed to accept requests from:
 * - Browser extension (IDEXX Neo integration) - uses Bearer token
 * - Admin dashboard - uses cookies
 * - External integrations - uses Bearer token
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate from either cookies or Authorization header
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as ScheduleVapiCallRequest;

    console.log('[VAPI_SCHEDULE] Received request', {
      phoneNumber: body.phoneNumber,
      petName: body.petName,
      scheduledFor: body.scheduledFor,
    });

    // Build dynamic variables with knowledge base integration
    const variablesResult = buildDynamicVariables({
      baseVariables: {
        clinicName: body.clinicName,
        agentName: body.agentName,
        petName: body.petName,
        ownerName: body.ownerName,
        appointmentDate: body.appointmentDate,
        callType: body.callType,
        clinicPhone: body.clinicPhone,
        emergencyPhone: body.emergencyPhone || body.clinicPhone,
        dischargeSummary: body.dischargeSummary,
        subType: body.subType,
        nextSteps: body.nextSteps,
        condition: body.condition,
        conditionCategory: body.conditionCategory as any,
        medications: body.medications,
        recheckDate: body.recheckDate,
        petSpecies: body.petSpecies,
        petAge: body.petAge,
        petWeight: body.petWeight,
        daysSinceTreatment: body.daysSinceTreatment,
      },
      strict: false,
      useDefaults: true,
    });

    // Check validation
    if (!variablesResult.validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: variablesResult.validation.errors,
          warnings: variablesResult.validation.warnings,
        },
        { status: 400 }
      );
    }

    // Get VAPI configuration
    const assistantId = body.assistantId || env.VAPI_ASSISTANT_ID || process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = body.phoneNumberId || env.VAPI_PHONE_NUMBER_ID || process.env.VAPI_PHONE_NUMBER_ID;

    if (!assistantId) {
      return NextResponse.json(
        { error: 'VAPI_ASSISTANT_ID not configured' },
        { status: 500 }
      );
    }

    if (!phoneNumberId) {
      return NextResponse.json(
        { error: 'VAPI_PHONE_NUMBER_ID not configured' },
        { status: 500 }
      );
    }

    // Determine scheduled time (default to immediate if not provided)
    const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : new Date();

    // Validate scheduled time is in the future
    if (!isFutureTime(scheduledFor)) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Format phone number for display
    const phoneNumberFormatted = formatPhoneNumber(body.phoneNumber);

    // Store scheduled call in database
    const { data: scheduledCall, error: dbError } = await supabase
      .from('scheduled_discharge_calls')
      .insert({
        user_id: user.id,
        assistant_id: assistantId,
        phone_number_id: phoneNumberId,
        customer_phone: body.phoneNumber,
        scheduled_for: scheduledFor.toISOString(),
        status: 'queued',
        dynamic_variables: variablesResult.variables,
        condition_category: variablesResult.knowledgeBase.conditionCategory,
        knowledge_base_used: variablesResult.knowledgeBase.displayName,
        metadata: {
          notes: body.notes,
          timezone: (body.metadata?.timezone as string) ?? 'America/Los_Angeles',
          retry_count: 0,
          max_retries: 3,
          ...(body.metadata ?? {}),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('[VAPI_SCHEDULE] Database error', {
        error: dbError,
      });
      return NextResponse.json(
        { error: 'Failed to create scheduled call' },
        { status: 500 }
      );
    }

    // Enqueue job in QStash
    let qstashMessageId: string;
    try {
      qstashMessageId = await scheduleCallExecution(scheduledCall.id, scheduledFor);
    } catch (qstashError) {
      console.error('[VAPI_SCHEDULE] QStash error', {
        error: qstashError,
      });

      // Rollback database insert
      await supabase.from('scheduled_discharge_calls').delete().eq('id', scheduledCall.id);

      return NextResponse.json(
        { error: 'Failed to schedule call execution' },
        { status: 500 }
      );
    }

    // Update database with QStash message ID
    await supabase
      .from('scheduled_discharge_calls')
      .update({
        metadata: {
          ...scheduledCall.metadata,
          qstash_message_id: qstashMessageId,
        },
      })
      .eq('id', scheduledCall.id);

    console.log('[VAPI_SCHEDULE] Call scheduled successfully', {
      callId: scheduledCall.id,
      scheduledFor: scheduledFor.toISOString(),
      qstashMessageId,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        callId: scheduledCall.id,
        scheduledFor: scheduledFor.toISOString(),
        qstashMessageId,
        petName: body.petName,
        ownerName: body.ownerName,
        phoneNumber: body.phoneNumber,
        phoneNumberFormatted,
        warnings: variablesResult.validation.warnings,
      },
    });
  } catch (error) {
    console.error('[VAPI_SCHEDULE] Error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'VAPI schedule call endpoint is active',
  });
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove + and non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');

  // US/Canada format
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // International format
  return `+${cleaned}`;
}
