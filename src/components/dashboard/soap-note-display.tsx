"use client";

import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { FileText } from "lucide-react";

interface SOAPNote {
  id: string;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  created_at: string;
}

interface SOAPNoteDisplayProps {
  notes: SOAPNote[];
}

export function SOAPNoteDisplay({ notes }: SOAPNoteDisplayProps) {
  if (notes.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        No SOAP notes available for this case
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note, index) => {
        const hasContent =
          note.subjective ?? note.objective ?? note.assessment ?? note.plan;

        if (!hasContent) {
          return null;
        }

        return (
          <div key={note.id} className="bg-card rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">
                  SOAP Note {notes.length > 1 ? `#${index + 1}` : ""}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            <Accordion type="multiple" className="w-full">
              {note.subjective && (
                <AccordionItem value="subjective">
                  <AccordionTrigger className="text-sm font-medium">
                    Subjective
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {note.subjective}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {note.objective && (
                <AccordionItem value="objective">
                  <AccordionTrigger className="text-sm font-medium">
                    Objective
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {note.objective}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {note.assessment && (
                <AccordionItem value="assessment">
                  <AccordionTrigger className="text-sm font-medium">
                    Assessment
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {note.assessment}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {note.plan && (
                <AccordionItem value="plan">
                  <AccordionTrigger className="text-sm font-medium">
                    Plan
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {note.plan}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        );
      })}
    </div>
  );
}
