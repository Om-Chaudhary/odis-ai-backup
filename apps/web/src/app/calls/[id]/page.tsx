import { createServiceClient } from "@odis-ai/data-access/db/server";
import { notFound } from "next/navigation";
import { CallDetailView } from "~/components/calls/call-detail-view";
import type { CallDetails } from "@odis-ai/shared/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CallPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServiceClient();

  // Fetch call details with patient info
  const { data: callData, error } = await supabase
    .from("scheduled_discharge_calls")
    .select(
      `
      *,
      cases (
        patients (
          id,
          name,
          species,
          owner_name
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !callData) {
    console.error("Error fetching call:", error);
    notFound();
  }

  // Transform data to match CallDetails interface
  // Note: The type assertion is needed because Supabase types might not fully match our manual join structure

  const rawCall = callData;
  const patient = rawCall.cases?.patients?.[0];

  const callDetails: CallDetails = {
    id: rawCall.id,
    status: rawCall.status,
    scheduled_for: rawCall.scheduled_for,
    started_at: rawCall.started_at,
    ended_at: rawCall.ended_at,
    duration_seconds: rawCall.duration_seconds,
    recording_url: rawCall.recording_url,
    transcript: rawCall.transcript,
    call_analysis: rawCall.call_analysis,
    cost: rawCall.cost,
    customer_phone: rawCall.customer_phone,
    case_id: rawCall.case_id,
    ended_reason: rawCall.ended_reason,
    patient: patient
      ? {
          id: patient.id,
          name: patient.name,
          species: patient.species,
          owner_name: patient.owner_name,
        }
      : undefined,
  };

  return <CallDetailView initialCall={callDetails} />;
}
