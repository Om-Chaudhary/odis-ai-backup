/**
 * Demo page for testing the new NeedsAttentionCard functionality
 * Access at: http://localhost:3000/demo/attention-card
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui";

// Import the components we built
import { NeedsAttentionCard } from "../../../components/dashboard/outbound/detail/needs-attention-card";
import { parseAttentionSummary } from "@odis-ai/shared/util";

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  attentionTypes: string[];
  attentionSeverity: "routine" | "urgent" | "critical";
  attentionSummary: string | null;
}

const demoScenarios: DemoScenario[] = [
  {
    id: "critical-emergency",
    name: "Critical Emergency",
    description: "Pet showing severe symptoms requiring immediate emergency care",
    attentionTypes: ["emergency_signs"],
    attentionSeverity: "critical",
    attentionSummary: "**[EMERGENCY] - Pet showing signs of bloat with distended abdomen: Contact emergency vet immediately - do not wait**"
  },
  {
    id: "urgent-callback",
    name: "Urgent Callback",
    description: "Owner dissatisfied with treatment, needs follow-up within 24 hours",
    attentionTypes: ["owner_dissatisfaction"],
    attentionSeverity: "urgent",
    attentionSummary: "**[COMPLAINT] - Owner unhappy with billing charges and treatment outcome: Schedule callback within 24 hours to discuss concerns**"
  },
  {
    id: "routine-medication",
    name: "Routine Medication Question",
    description: "Standard question about medication administration",
    attentionTypes: ["medication_question"],
    attentionSeverity: "routine",
    attentionSummary: "**[MEDICATION] - Confusion about antibiotic timing with meals: Clarify dosing schedule during business hours**"
  },
  {
    id: "appointment-needed",
    name: "Appointment Needed",
    description: "Follow-up appointment required for post-surgical care",
    attentionTypes: ["appointment_needed"],
    attentionSeverity: "urgent",
    attentionSummary: "**[FOLLOW-UP] - Post-surgical complications observed: Schedule recheck appointment within 48 hours to assess healing**"
  },
  {
    id: "legacy-format",
    name: "Legacy Unstructured Format",
    description: "Example of old unstructured attention summary",
    attentionTypes: ["callback_request"],
    attentionSeverity: "urgent",
    attentionSummary: "Owner called back 3 times asking about Rocky's discharge instructions. Seems confused about the medication schedule and when to return for suture removal. Please call back to clarify instructions."
  },
  {
    id: "no-attention",
    name: "No Attention Needed",
    description: "Normal case without attention flags",
    attentionTypes: [],
    attentionSeverity: "routine",
    attentionSummary: null
  }
];

export default function AttentionCardDemoPage() {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(demoScenarios[0]!);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            NeedsAttentionCard Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the new attention card functionality with various scenarios
          </p>
          <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg inline-block">
            🎯 This demonstrates the new side panel card that replaces the summary column
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scenario Selector */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Test Scenarios</h2>
            <div className="space-y-2">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedScenario.id === scenario.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">{scenario.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{scenario.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scenario.attentionSeverity === "critical" ? "bg-red-100 text-red-800" :
                      scenario.attentionSeverity === "urgent" ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {scenario.attentionSeverity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {scenario.attentionTypes.length} types
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Card Preview</h2>
            <div className="p-4 bg-white rounded-lg border">
              <div className="text-sm text-gray-600 mb-4">
                This is how the card appears in the outbound detail side panel:
              </div>

              {/* The actual NeedsAttentionCard component */}
              <NeedsAttentionCard
                attentionTypes={selectedScenario.attentionTypes}
                attentionSeverity={selectedScenario.attentionSeverity}
                attentionSummary={selectedScenario.attentionSummary}
              />

              {selectedScenario.attentionTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ✅ No attention card displayed - case doesn't need attention
                </div>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Technical Details</h2>

            {/* Data Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Input Data</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                <pre className="bg-gray-100 p-2 rounded overflow-auto">
{JSON.stringify({
  attentionTypes: selectedScenario.attentionTypes,
  attentionSeverity: selectedScenario.attentionSeverity,
  attentionSummary: selectedScenario.attentionSummary
}, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Parsed Summary */}
            {selectedScenario.attentionSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Parsed Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <pre className="bg-gray-100 p-2 rounded overflow-auto">
{JSON.stringify(parseAttentionSummary(selectedScenario.attentionSummary), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Implementation Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Implementation Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <strong>Location:</strong> Appears in outbound detail side panel above CallSummary
                </div>
                <div>
                  <strong>Visibility:</strong> Only shows when <code>hasActionableAttentionTypes()</code> returns true
                </div>
                <div>
                  <strong>Parsing:</strong> Uses new attention parser to extract reason, context, and action
                </div>
                <div>
                  <strong>Fallback:</strong> Gracefully handles legacy unstructured summaries
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test in Production Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Steps to see this in action:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Navigate to the outbound dashboard: <code>/dashboard/[clinicSlug]/outbound</code></li>
                <li>Click on a case that has attention flags (attention_types is not empty)</li>
                <li>The NeedsAttentionCard will appear at the top of the right side panel</li>
                <li>The summary column has been removed from the table for a cleaner layout</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900">What Changed:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>Removed "Summary" column from outbound table</li>
                <li>Added NeedsAttentionCard component to side panel above call summary</li>
                <li>Card shows structured attention information with severity-based styling</li>
                <li>Supports both new structured format and legacy unstructured summaries</li>
                <li>Only displays when case actually needs attention (hasActionableAttentionTypes)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}