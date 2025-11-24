/**
 * Script to delete cases for nimirbath that have no transcriptions or SOAP notes
 * Usage: tsx scripts/delete-empty-cases.ts
 */

import { createServiceClient } from "../src/lib/supabase/server";

async function deleteEmptyCases() {
  const supabase = await createServiceClient();

  // First, get the user ID for nimirbath
  const { data: userData, error: userError } = await supabase
    .from("auth.users")
    .select("id, email")
    .eq("email", "nimirbath@gmail.com")
    .single();

  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }

  if (!userData) {
    console.error("User not found: nimirbath@gmail.com");
    return;
  }

  console.log(`Found user: ${userData.email} (${userData.id})`);

  // Find cases without transcriptions or SOAP notes
  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select("id, created_at, pet_name, owner_name, transcription, soap_note")
    .eq("user_id", userData.id)
    .is("transcription", null)
    .is("soap_note", null)
    .order("created_at", { ascending: false });

  if (casesError) {
    console.error("Error fetching cases:", casesError);
    return;
  }

  if (!cases || cases.length === 0) {
    console.log("No empty cases found for this user.");
    return;
  }

  console.log(
    `\nFound ${cases.length} cases without transcriptions/SOAP notes:`,
  );
  cases.forEach((c, i) => {
    console.log(
      `${i + 1}. ID: ${c.id} | Pet: ${c.pet_name} | Owner: ${c.owner_name} | Created: ${new Date(c.created_at).toLocaleString()}`,
    );
  });

  // Delete the cases
  const caseIds = cases.map((c) => c.id);
  const { error: deleteError } = await supabase
    .from("cases")
    .delete()
    .in("id", caseIds);

  if (deleteError) {
    console.error("Error deleting cases:", deleteError);
    return;
  }

  console.log(`\n✅ Successfully deleted ${cases.length} cases.`);
}

deleteEmptyCases().catch(console.error);
