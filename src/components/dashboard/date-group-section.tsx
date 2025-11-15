"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { CallsDataTable } from "./calls-data-table";
import type { CallDetailResponse } from "~/server/actions/retell";
import {
  groupByDate,
  getDateGroupLabel,
  DATE_GROUP_ORDER,
} from "~/lib/utils/date-grouping";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "lucide-react";

interface DateGroupSectionProps {
  calls: CallDetailResponse[];
}

export function DateGroupSection({ calls }: DateGroupSectionProps) {
  // Group calls by date
  const groupedCalls = groupByDate(calls);

  // Track which sections are open (default: today and yesterday open)
  const [openSections, setOpenSections] = useState<string[]>(["today", "yesterday"]);

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4"
      >
        {DATE_GROUP_ORDER.map((group) => {
          const callsInGroup = groupedCalls.get(group) ?? [];

          // Skip empty groups
          if (callsInGroup.length === 0) {
            return null;
          }

          const groupLabel = getDateGroupLabel(group, callsInGroup.length);

          return (
            <AccordionItem
              key={group}
              value={group}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{groupLabel.label}</h3>
                    <Badge variant="secondary">{callsInGroup.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-auto mr-4">
                    {groupLabel.description}
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-4 pt-2">
                <CallsDataTable data={callsInGroup} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Empty state if no calls */}
      {calls.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
          <p className="text-sm text-muted-foreground">
            Click &quot;New Call&quot; to initiate your first call
          </p>
        </div>
      )}
    </div>
  );
}
