"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { Loader2, Copy, FlaskConical } from "lucide-react";

// Sample veterinary transcription for testing
const SAMPLE_TRANSCRIPTION = `Dr. Sarah Johnson: Good morning! What brings Max in today?

Owner: Hi Dr. Johnson. Max has been limping on his right front leg for about three days now. He seems to be in pain when he puts weight on it.

Dr. Sarah Johnson: I see. Did anything specific happen? Did he fall or get injured that you know of?

Owner: Not that I saw. He was playing in the backyard and when he came inside, he was limping. It's gotten a bit worse since then.

Dr. Sarah Johnson: Okay, let me take a look. Max, you're such a good boy. I'm going to gently examine your leg now. Does this hurt when I press here?

[Dog whimpers]

Owner: Yeah, he definitely doesn't like that.

Dr. Sarah Johnson: I can feel some swelling in the carpus area - that's his wrist. Let me check his range of motion. There's definitely some resistance and pain with flexion. I'd like to take some radiographs to rule out a fracture or soft tissue injury.

Owner: Okay, whatever he needs.

Dr. Sarah Johnson: Great. We'll take him back for X-rays. It should only take about 15 minutes.

[15 minutes later]

Dr. Sarah Johnson: Good news - no fractures on the radiographs. It appears to be a soft tissue injury, likely a sprain. I can see some soft tissue swelling around the carpal joint.

Owner: Oh, that's a relief. What do we do for it?

Dr. Sarah Johnson: We'll put him on an NSAID for pain and inflammation - I'll prescribe carprofen 75mg, one tablet twice daily with food for 7 days. He also needs strict rest for at least two weeks - no running, jumping, or rough play. Short leash walks only for bathroom breaks.

Owner: Should we do anything else?

Dr. Sarah Johnson: Yes, cold compresses can help with the swelling. Apply an ice pack wrapped in a towel to the affected area for 10-15 minutes, 3-4 times daily for the first few days. If he's not showing significant improvement in 3-5 days, or if he gets worse, bring him back and we may need to consider additional imaging or referral to a specialist.

Owner: Okay, got it. Thank you so much.

Dr. Sarah Johnson: You're welcome. I'll have the receptionist go over the discharge instructions and medication with you. Max should be feeling better soon with rest and medication.`;

interface SoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  clientInstructions: string;
}

export default function SoapPlayground() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [transcription, setTranscription] = useState("");
  const [subjectiveTemplate, setSubjectiveTemplate] = useState("");
  const [objectiveTemplate, setObjectiveTemplate] = useState("");
  const [subjectivePrompt, setSubjectivePrompt] = useState("");
  const [objectivePrompt, setObjectivePrompt] = useState("");
  const [systemPromptAddition, setSystemPromptAddition] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [userId, setUserId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [soapResult, setSoapResult] = useState<SoapResponse | null>(null);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = api.playground.getTemplatesForPlayground.useQuery();

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const template = templates?.find((t: { id: string }) => t.id === id);

    if (template) {
      setSubjectiveTemplate(template.subjective_template ?? "");
      setObjectiveTemplate(template.objective_template ?? "");
      setSubjectivePrompt(template.subjective_prompt ?? "");
      setObjectivePrompt(template.objective_prompt ?? "");
      setSystemPromptAddition(template.system_prompt_addition ?? "");
      setTemplateId(template.template_id ?? "");
      setUserId(template.user_id ?? "");
    }
  };

  const handleLoadSample = () => {
    setTranscription(SAMPLE_TRANSCRIPTION);
    toast.success("Sample transcription loaded");
  };

  const handleClearAll = () => {
    setSelectedTemplateId("");
    setTranscription("");
    setSubjectiveTemplate("");
    setObjectiveTemplate("");
    setSubjectivePrompt("");
    setObjectivePrompt("");
    setSystemPromptAddition("");
    setTemplateId("");
    setUserId("");
    setSoapResult(null);
    toast.success("All fields cleared");
  };

  const handleGenerate = async () => {
    if (!transcription.trim()) {
      toast.error("Please provide a transcription");
      return;
    }

    setIsGenerating(true);
    setSoapResult(null);

    try {
      const payload: {
        transcription: string;
        template_id?: string;
        user_id?: string;
        template?: {
          subjective_template?: string;
          objective_template?: string;
          subjective_prompt?: string;
          objective_prompt?: string;
          system_prompt_addition?: string;
        };
      } = {
        transcription: transcription.trim(),
      };

      // Add template_id if provided
      if (templateId.trim()) {
        payload.template_id = templateId.trim();
      }

      // Add user_id if provided
      if (userId.trim()) {
        payload.user_id = userId.trim();
      }

      // Add template overrides if any are provided
      const hasTemplateOverrides =
        subjectiveTemplate.trim() ||
        objectiveTemplate.trim() ||
        subjectivePrompt.trim() ||
        objectivePrompt.trim() ||
        systemPromptAddition.trim();

      if (hasTemplateOverrides) {
        payload.template = {};
        if (subjectiveTemplate.trim()) payload.template.subjective_template = subjectiveTemplate.trim();
        if (objectiveTemplate.trim()) payload.template.objective_template = objectiveTemplate.trim();
        if (subjectivePrompt.trim()) payload.template.subjective_prompt = subjectivePrompt.trim();
        if (objectivePrompt.trim()) payload.template.objective_prompt = objectivePrompt.trim();
        if (systemPromptAddition.trim()) payload.template.system_prompt_addition = systemPromptAddition.trim();
      }

      const response = await fetch("/api/generate-soap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as SoapResponse;
      setSoapResult(data);
      toast.success("SOAP note generated successfully!");
    } catch (error) {
      console.error("Error generating SOAP note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate SOAP note");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">SOAP Playground</h1>
        <p className="text-lg text-muted-foreground">
          Test the generate-soap-notes-v2 edge function with different templates and inputs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Template Selection</CardTitle>
              <CardDescription>Select a template to prefill the fields below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-select">Choose Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect} disabled={templatesLoading}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder={templatesLoading ? "Loading templates..." : "Select a template"} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: {
                      id: string;
                      template_name: string;
                      user?: { email?: string | null } | null;
                    }) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name} - {template.user?.email ?? "No user"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleLoadSample} variant="outline" className="flex-1">
                  Load Sample
                </Button>
                <Button onClick={handleClearAll} variant="outline" className="flex-1">
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transcription */}
          <Card>
            <CardHeader>
              <CardTitle>Transcription</CardTitle>
              <CardDescription>The appointment transcription to process (required)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="Enter or paste the appointment transcription here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Template ID and User ID */}
          <Card>
            <CardHeader>
              <CardTitle>Template & User IDs</CardTitle>
              <CardDescription>Optional identifiers for the request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-id">Template ID</Label>
                <Input
                  id="template-id"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="template_id (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user_id (optional)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Overrides */}
          <Card>
            <CardHeader>
              <CardTitle>Template Overrides</CardTitle>
              <CardDescription>Optional template customizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjective-template">Subjective Template</Label>
                <Textarea
                  id="subjective-template"
                  value={subjectiveTemplate}
                  onChange={(e) => setSubjectiveTemplate(e.target.value)}
                  placeholder="Subjective section template..."
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective-template">Objective Template</Label>
                <Textarea
                  id="objective-template"
                  value={objectiveTemplate}
                  onChange={(e) => setObjectiveTemplate(e.target.value)}
                  placeholder="Objective section template..."
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjective-prompt">Subjective Prompt</Label>
                <Textarea
                  id="subjective-prompt"
                  value={subjectivePrompt}
                  onChange={(e) => setSubjectivePrompt(e.target.value)}
                  placeholder="AI prompt for subjective section..."
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective-prompt">Objective Prompt</Label>
                <Textarea
                  id="objective-prompt"
                  value={objectivePrompt}
                  onChange={(e) => setObjectivePrompt(e.target.value)}
                  placeholder="AI prompt for objective section..."
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt Addition</Label>
                <Textarea
                  id="system-prompt"
                  value={systemPromptAddition}
                  onChange={(e) => setSystemPromptAddition(e.target.value)}
                  placeholder="Additional system prompt..."
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={isGenerating || !transcription.trim()} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating SOAP Note...
              </>
            ) : (
              <>
                <FlaskConical className="mr-2 h-5 w-5" />
                Generate SOAP Note
              </>
            )}
          </Button>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Generated SOAP note sections will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {!soapResult && (
                <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FlaskConical className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No results yet. Generate a SOAP note to see the output.</p>
                  </div>
                </div>
              )}

              {soapResult && (
                <div className="space-y-4">
                  {/* Subjective */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Subjective</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(soapResult.subjective, "Subjective")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{soapResult.subjective}</p>
                    </CardContent>
                  </Card>

                  {/* Objective */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Objective</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(soapResult.objective, "Objective")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{soapResult.objective}</p>
                    </CardContent>
                  </Card>

                  {/* Assessment */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Assessment</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(soapResult.assessment, "Assessment")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{soapResult.assessment}</p>
                    </CardContent>
                  </Card>

                  {/* Plan */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Plan</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(soapResult.plan, "Plan")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{soapResult.plan}</p>
                    </CardContent>
                  </Card>

                  {/* Client Instructions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Client Instructions</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(soapResult.clientInstructions, "Client Instructions")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{soapResult.clientInstructions}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
