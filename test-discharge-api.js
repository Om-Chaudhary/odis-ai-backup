/**
 * Test script to verify the /api/calls/schedule endpoint
 * Run this with: node test-discharge-api.js
 */

const testDischargeAPI = async () => {
  // Test data matching the expected scheduleCallSchema
  const testData = {
    // Contact information
    phoneNumber: "+19253736057", // Test phone from garrybath@hotmail.com profile

    // Core patient/appointment details
    petName: "Max",
    ownerName: "Test Owner",
    appointmentDate: "November twenty-seventh",

    // Call type
    callType: "discharge",

    // Clinic information
    clinicName: "Alum Rock",
    clinicPhone: "four zero eight, five five five, one two three four",
    emergencyPhone: "four zero eight, five five five, one two three four",

    // Agent name
    agentName: "Sarah",

    // Clinical details
    dischargeSummary:
      "This is a test discharge summary for Max. The patient was seen for a routine wellness exam.",

    // Optional fields for discharge
    subType: "wellness",
    vetName: "Dr. Smith",
    nextSteps: "Continue medications as prescribed. Monitor for any changes.",

    // Scheduling (schedule for 1 minute from now for testing)
    scheduledFor: new Date(Date.now() + 60000).toISOString(),

    // Metadata
    metadata: {
      source: "test-script",
      test: true,
    },
  };

  console.log("Testing /api/calls/schedule endpoint...");
  console.log("Request data:", JSON.stringify(testData, null, 2));

  try {
    // Note: You'll need to provide a valid Bearer token for authentication
    // You can get this from the Supabase dashboard or by logging in
    const BEARER_TOKEN = "YOUR_BEARER_TOKEN_HERE";

    const response = await fetch("http://localhost:3000/api/calls/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BEARER_TOKEN}`,
        Origin: "https://us.idexxneo.com", // Simulate IDEXX origin for CORS
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.log("Response text:", responseText);
      throw new Error("Failed to parse response as JSON");
    }

    if (response.ok) {
      console.log("✅ Success! Call scheduled:");
      console.log(JSON.stringify(result, null, 2));

      if (result.data && result.data.callId) {
        console.log(`\n📞 Call ID: ${result.data.callId}`);
        console.log(`📅 Scheduled for: ${result.data.scheduledFor}`);
        console.log(
          `📦 QStash Message ID: ${result.data.qstashMessageId || "N/A"}`,
        );
      }
    } else {
      console.log("❌ Error response:");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
};

// Instructions for getting a Bearer token
console.log(`
===========================================
TEST INSTRUCTIONS:
===========================================
1. Get a Bearer token for garrybath@hotmail.com:
   - Login to your app as garrybath@hotmail.com
   - Open browser DevTools > Network tab
   - Look for any API request with Authorization header
   - Copy the token after "Bearer "

2. Update the BEARER_TOKEN variable in this script

3. Make sure your Next.js dev server is running:
   cd /Users/s0381806/Development/odis-ai-web
   pnpm dev

4. Run this test:
   node test-discharge-api.js

===========================================
`);

// Uncomment to run the test after setting the token
// testDischargeAPI();
