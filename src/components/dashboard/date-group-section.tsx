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
  const [openSections, setOpenSections] = useState<string[]>([
    "today",
    "yesterday",
  ]);

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
              className="overflow-hidden rounded-lg border"
            >
              <AccordionTrigger className="hover:bg-muted/50 px-6 py-4 transition-colors hover:no-underline">
                <div className="flex flex-1 items-center gap-3">
                  <Calendar className="text-primary h-5 w-5" />
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {groupLabel.label}
                    </h3>
                    <Badge variant="secondary">{callsInGroup.length}</Badge>
                  </div>
                  <p className="text-muted-foreground mr-4 ml-auto text-sm">
                    {groupLabel.description}
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pt-2 pb-4">
                <CallsDataTable data={callsInGroup} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Empty state if no calls */}
      {calls.length === 0 && (
        <div className="rounded-lg border-2 border-dashed py-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No calls yet</h3>
          <p className="text-muted-foreground text-sm">
            Click &quot;New Call&quot; to initiate your first call
          </p>
        </div>
      )}
    </div>
  );
}
