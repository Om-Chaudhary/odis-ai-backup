/**
 * GET /api/vapi/calls
 *
 * Lists all VAPI calls for the authenticated user with optional filtering.
 *
 * Query parameters:
 * - status: Filter by call status (e.g., 'queued', 'in-progress', 'ended')
 * - conditionCategory: Filter by condition category
 * - limit: Maximum number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '~/lib/supabase/server';
import { listVapiCalls } from '~/lib/vapi/call-manager';

export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const conditionCategory = searchParams.get('conditionCategory') || undefined;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { error: 'Invalid limit or offset parameter' },
        { status: 400 }
      );
    }

    // Step 3: Get calls from database
    const calls = await listVapiCalls(user.id, {
      status,
      conditionCategory,
      limit,
      offset,
    });

    // Step 4: Return response
    return NextResponse.json({
      success: true,
      data: calls,
      pagination: {
        limit,
        offset,
        count: calls.length,
      },
    });
  } catch (error) {
    console.error('Error listing VAPI calls:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
