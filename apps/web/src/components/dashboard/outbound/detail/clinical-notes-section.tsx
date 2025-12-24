import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Stethoscope } from "lucide-react";

interface SoapNote {
  id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  clientInstructions: string | null;
  createdAt: string;
}

interface ClinicalNotesSectionProps {
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  hasIdexxNotes: boolean;
}

/**
 * Clinical Notes Section - Shows IDEXX or SOAP notes
 */
export function ClinicalNotesSection({ soapNotes }: ClinicalNotesSectionProps) {
  // Show SOAP notes
  if (soapNotes && soapNotes.length > 0) {
    const latestNote = soapNotes[0]!;
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            SOAP Notes
            <Badge variant="secondary" className="text-xs">
              Clinical
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-background max-h-64 space-y-3 overflow-auto rounded-md p-3">
            {latestNote.subjective && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Subjective
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.subjective}
                </p>
              </div>
            )}
            {latestNote.objective && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Objective
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.objective}
                </p>
              </div>
            )}
            {latestNote.assessment && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Assessment
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.assessment}
                </p>
              </div>
            )}
            {latestNote.plan && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Plan
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.plan}
                </p>
              </div>
            )}
            {latestNote.clientInstructions && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Client Instructions
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.clientInstructions}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
