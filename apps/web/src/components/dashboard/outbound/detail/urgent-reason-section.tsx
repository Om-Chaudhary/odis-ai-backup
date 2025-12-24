import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { AlertTriangle } from "lucide-react";

interface UrgentReasonSectionProps {
  callId: string;
}

/**
 * Urgent Reason Section (Legacy)
 * Displays why a case was flagged as urgent by the AI
 * Note: Static display - getUrgentSummary API endpoint not yet implemented
 */
export function UrgentReasonSection({
  callId: _callId,
}: UrgentReasonSectionProps) {
  return (
    <Card className="border-orange-500/20 bg-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Needs Attention
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-700 dark:text-orange-400"
          >
            AI Flagged
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          This case was flagged as urgent by the AI agent.
        </p>
      </CardContent>
    </Card>
  );
}
