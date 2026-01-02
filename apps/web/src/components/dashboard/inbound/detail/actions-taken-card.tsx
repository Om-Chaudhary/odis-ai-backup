/**
 * Actions Taken Card
 *
 * Displays the call outcome badge and list of actions taken during the call.
 * Used in the inbound call detail panel.
 *
 * NOTE: This component is currently unused but kept for future reference.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { CheckCircle2 } from "lucide-react";
import { OutcomeBadge } from "../table/outcome-badge";
import type { Database } from "@odis-ai/shared/types";

// Use Database type for compatibility
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface ActionsTakenCardProps {
  call: InboundCall;
  actionsTaken: string[] | null | undefined;
}

export function ActionsTakenCard({
  call,
  actionsTaken,
}: ActionsTakenCardProps) {
  // Don't render if no outcome and no actions
  if (!call.outcome && (!actionsTaken || actionsTaken.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          Actions Taken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Outcome Badge */}
        {call.outcome && (
          <div>
            <OutcomeBadge call={call} />
          </div>
        )}

        {/* Actions List */}
        {actionsTaken && actionsTaken.length > 0 && (
          <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {actionsTaken.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-slate-400">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state if outcome but no actions */}
        {call.outcome && (!actionsTaken || actionsTaken.length === 0) && (
          <p className="text-muted-foreground text-sm italic">
            No specific actions recorded
          </p>
        )}
      </CardContent>
    </Card>
  );
}
