/**
 * VAPI Eval Test Suite Creator - Essential Tests
 * Creates 10 key test cases for the Alum Rock After-Hours Inbound Assistant
 *
 * Usage:
 *   VAPI_API_KEY=your_key npx tsx scripts/vapi-create-evals.ts
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";
const BASE_URL = "https://api.vapi.ai";

if (!VAPI_API_KEY) {
  console.error("Error: VAPI_API_KEY environment variable is required");
  process.exit(1);
}

interface UserMessage {
  role: "user";
  content: string;
}

interface AssistantEvalMessage {
  role: "assistant";
  judgePlan: {
    type: "ai";
    model: {
      provider: "openai";
      model: "gpt-4o";
      messages: Array<{
        role: "system";
        content: string;
      }>;
    };
  };
}

type EvalMessage = UserMessage | AssistantEvalMessage;

interface TestCase {
  name: string;
  description: string;
  messages: EvalMessage[];
}

// Helper to create user message
const user = (content: string): UserMessage => ({
  role: "user",
  content,
});

// Helper to create assistant evaluation checkpoint with AI judge
const evalAssistant = (criteria: string): AssistantEvalMessage => ({
  role: "assistant",
  judgePlan: {
    type: "ai",
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an LLM-Judge evaluating the assistant's response.

Criteria: ${criteria}

Rules:
- PASS if the criteria is clearly satisfied
- FAIL if the criteria is not satisfied or unclear

Respond with exactly one word: pass or fail`,
        },
      ],
    },
  },
});

// ============================================================================
// 10 ESSENTIAL TEST CASES
// ============================================================================

const testCases: TestCase[] = [
  // 1. NEW CLIENT BOOKING (core flow)
  {
    name: "01 New Client Booking Flow",
    description: `Core booking flow for new clients: collect name, phone (confirm it), pet info, reason, and proceed to scheduling.`,
    messages: [
      user("Hi, I need to bring my dog in for a checkup"),
      evalAssistant(
        "Did the assistant ask if this is a new or existing client?",
      ),
      user("This is my first time"),
      evalAssistant("Did the assistant ask for the caller's name?"),
      user("John Smith"),
      evalAssistant("Did the assistant ask for a phone number?"),
      user("four oh eight, five five five, one two three four"),
      evalAssistant("Did the assistant read back or confirm the phone number?"),
      user("Yes that's correct"),
      evalAssistant("Did the assistant ask for the pet's name?"),
      user("Buddy, he's a golden retriever"),
      evalAssistant("Did the assistant ask for the reason for the visit?"),
      user("Just a wellness exam"),
      evalAssistant(
        "Did the assistant offer to schedule or check availability?",
      ),
    ],
  },

  // 2. EXISTING CLIENT BOOKING (don't re-ask pet info)
  {
    name: "02 Existing Client Booking",
    description: `Existing client with pet info already given - should NOT re-ask pet name/species. Collect name, phone, reason.`,
    messages: [
      user("Hi, I need to schedule an appointment for my cat Luna"),
      evalAssistant(
        "Did the assistant ask if new or existing WITHOUT re-asking pet name?",
      ),
      user("Yes I've been there before"),
      evalAssistant("Did the assistant ask for the caller's name?"),
      user("Sarah Johnson"),
      evalAssistant("Did the assistant ask for phone number?"),
      user("four oh eight, two two two, three three three three"),
      evalAssistant("Did the assistant confirm the phone number?"),
      user("Yes"),
      evalAssistant(
        "Did the assistant ask for the reason WITHOUT re-asking pet name/species?",
      ),
      user("She's been sneezing a lot"),
      evalAssistant(
        "Did the assistant offer to check availability or schedule?",
      ),
    ],
  },

  // 3. TRUE EMERGENCY - BREATHING
  {
    name: "03 Emergency - Breathing Difficulty",
    description: `TRUE emergency: Breathing difficulty requires immediate emergency referral, NOT a regular appointment.`,
    messages: [
      user("My dog is having trouble breathing, he's gasping for air"),
      evalAssistant(
        "Did the assistant recognize this as an emergency and direct to emergency vet or hospital WITHOUT offering to schedule a regular appointment?",
      ),
      user("It's getting worse, what do I do?"),
      evalAssistant(
        "Did the assistant continue emphasizing emergency care urgency?",
      ),
    ],
  },

  // 4. NON-EMERGENCY - LIMPING
  {
    name: "04 Non-Emergency - Limping",
    description: `Non-emergency: Limping should be treated as a regular appointment, NOT escalated to emergency.`,
    messages: [
      user("My cat has been limping since yesterday"),
      evalAssistant(
        "Did the assistant treat this as non-emergency and offer to schedule a regular appointment?",
      ),
      user("Yes please, I'd like to bring her in"),
      evalAssistant("Did the assistant proceed with normal booking flow?"),
    ],
  },

  // 5. AI DISCLOSURE
  {
    name: "05 AI Transparency",
    description: `When asked, assistant should honestly disclose being AI and offer human callback if preferred.`,
    messages: [
      user("Wait, am I talking to a real person or a robot?"),
      evalAssistant(
        "Did the assistant honestly disclose being an AI/virtual assistant?",
      ),
      user("I'd rather talk to a human"),
      evalAssistant(
        "Did the assistant respect the preference and offer a callback WITHOUT pressuring to continue?",
      ),
    ],
  },

  // 6. LUNCH HOUR HANDLING
  {
    name: "06 Lunch Hour Unavailability",
    description: `When caller requests 12-2 PM slot, assistant should indicate lunch closure and offer alternatives.`,
    messages: [
      user("I need to book an appointment"),
      evalAssistant("Did the assistant begin the booking flow?"),
      user(
        "I'm an existing client, Mike Davis, four oh eight one one one two two two two",
      ),
      evalAssistant("Did the assistant confirm and proceed?"),
      user("Yes. My dog Rex needs vaccines. I want to come at 12:30 PM"),
      evalAssistant(
        "Did the assistant indicate 12:30 PM is unavailable due to lunch closure?",
      ),
      user("What about 1 PM?"),
      evalAssistant(
        "Did the assistant also indicate 1 PM is within lunch closure hours?",
      ),
    ],
  },

  // 7. CLINIC INFO
  {
    name: "07 Clinic Hours and Location",
    description: `Answer basic clinic questions: hours, address, phone number.`,
    messages: [
      user("What are your hours?"),
      evalAssistant("Did the assistant provide clinic operating hours?"),
      user("Where are you located?"),
      evalAssistant("Did the assistant provide the clinic address?"),
      user("Thanks!"),
      evalAssistant("Did the assistant respond appropriately?"),
    ],
  },

  // 8. CALLBACK REQUEST
  {
    name: "08 Non-Appointment Callback",
    description: `For non-appointment requests (billing, questions), take message for callback instead of forcing appointment.`,
    messages: [
      user("I have a billing question, can someone call me back?"),
      evalAssistant(
        "Did the assistant recognize this as a callback request and offer to take a message?",
      ),
      user(
        "Yes, my name is Jane Doe, four oh eight nine nine nine one one one one",
      ),
      evalAssistant("Did the assistant confirm the info for callback?"),
      user("Thanks"),
      evalAssistant(
        "Did the assistant close appropriately WITHOUT pushing an appointment?",
      ),
    ],
  },

  // 9. EMPATHETIC RESPONSE
  {
    name: "09 Empathetic Worried Caller",
    description: `Respond with empathy to worried callers while assessing severity appropriately.`,
    messages: [
      user("I'm really scared, my puppy won't stop crying"),
      evalAssistant(
        "Did the assistant respond with empathy and ask clarifying questions?",
      ),
      user("She's holding up her paw, I think something is stuck"),
      evalAssistant(
        "Did the assistant show concern while recognizing this as non-emergency?",
      ),
      user("Can I bring her in soon?"),
      evalAssistant(
        "Did the assistant offer to help schedule with a warm, reassuring tone?",
      ),
    ],
  },

  // 10. PHONE NUMBER CORRECTION
  {
    name: "10 Phone Number Correction",
    description: `Accept phone number corrections gracefully and use the corrected number.`,
    messages: [
      user("I need to book an appointment, I'm an existing client, Tom Wilson"),
      evalAssistant("Did the assistant ask for phone number?"),
      user("four oh eight, five five five, six seven eight nine"),
      evalAssistant("Did the assistant read back or confirm the phone number?"),
      user("No that's wrong, it's six seven NINE eight"),
      evalAssistant("Did the assistant accept the correction gracefully?"),
      user("Yes, that's correct now"),
      evalAssistant("Did the assistant proceed with the corrected number?"),
    ],
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function createEval(
  testCase: TestCase,
): Promise<{ id: string; name: string }> {
  const response = await fetch(`${BASE_URL}/eval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: testCase.name,
      description: testCase.description,
      type: "chat.mockConversation",
      messages: testCase.messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { id: data.id, name: data.name };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🧪 VAPI Eval - 10 Essential Tests");
  console.log("==================================");
  console.log(`Assistant: OdisAI - Alum Rock After-Hours Inbound`);
  console.log(`Assistant ID: ${ASSISTANT_ID}`);
  console.log(`Total test cases: ${testCases.length}`);
  console.log("");

  const results: {
    name: string;
    status: "success" | "error";
    id?: string;
    error?: string;
  }[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[${i + 1}/${testCases.length}] Creating: ${testCase.name}`);

    try {
      const result = await createEval(testCase);
      results.push({ name: testCase.name, status: "success", id: result.id });
      console.log(`   ✅ Created: ${result.id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ name: testCase.name, status: "error", error: errorMsg });
      console.log(`   ❌ Error: ${errorMsg}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("");
  console.log("==================================");
  console.log("Summary:");
  const successful = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "error");
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed tests:");
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
  }

  console.log("\nCreated eval IDs:");
  successful.forEach((s) => console.log(`  ${s.name}: ${s.id}`));
}

main().catch(console.error);
