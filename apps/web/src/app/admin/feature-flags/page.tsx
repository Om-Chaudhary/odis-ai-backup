import type { Metadata } from "next";
import { enableVoicemailDetection } from "~/flags";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/ui/card";
import { Badge } from "@odis-ai/ui/badge";

export const metadata: Metadata = {
  title: "Feature Flags | Admin",
  description: "Manage feature flags and experimental features",
};

export default async function FeatureFlagsPage() {
  const voicemailEnabled = await enableVoicemailDetection();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <p className="text-muted-foreground mt-2">
          Manage feature flags for the application. Flags control experimental
          or rollout features.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Voicemail Detection</CardTitle>
                <CardDescription>
                  Enable automatic voicemail detection and message leaving for
                  VAPI calls
                </CardDescription>
              </div>
              <Badge variant={voicemailEnabled ? "default" : "secondary"}>
                {voicemailEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium">When Enabled:</h4>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  <li>VAPI automatically detects voicemail systems</li>
                  <li>Leaves a personalized message using dynamic variables</li>
                  <li>Ends the call after leaving the message</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium">When Disabled:</h4>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  <li>
                    VAPI attempts calls normally without voicemail detection
                  </li>
                  <li>
                    Assistant handles voicemail based on system prompt only
                  </li>
                </ul>
              </div>
              <div className="bg-muted mt-4 rounded-lg p-4">
                <p className="text-sm">
                  <strong>To change this flag:</strong>
                </p>
                <ol className="text-muted-foreground mt-2 list-inside list-decimal space-y-1 text-sm">
                  <li>
                    Edit{" "}
                    <code className="bg-background rounded px-1 py-0.5">
                      src/flags.ts
                    </code>
                  </li>
                  <li>
                    Change the{" "}
                    <code className="bg-background rounded px-1 py-0.5">
                      defaultValue
                    </code>{" "}
                    or{" "}
                    <code className="bg-background rounded px-1 py-0.5">
                      decide()
                    </code>{" "}
                    function
                  </li>
                  <li>
                    Or integrate with Vercel Edge Config for runtime control
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>
              Integrate with providers for runtime flag management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-3 text-sm">
              <p>
                For production environments, you can integrate feature flags
                with:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1">
                <li>
                  <strong>Vercel Edge Config</strong> - Store flags in
                  Vercel&apos;s edge network
                </li>
                <li>
                  <strong>Environment Variables</strong> - Control via
                  deployment environment
                </li>
                <li>
                  <strong>External Providers</strong> - LaunchDarkly, Split,
                  etc.
                </li>
              </ul>
              <p className="mt-4">
                See the{" "}
                <a
                  href="https://flags-sdk.dev/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Flags SDK Providers documentation
                </a>{" "}
                for integration guides.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
