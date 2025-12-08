"use client";

import { Switch } from "@odis/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis/ui/card";
import { Phone, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis/ui/tooltip";

interface VoicemailFlagToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

export function VoicemailFlagToggle({
  enabled,
  onToggle,
  isLoading = false,
}: VoicemailFlagToggleProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle className="text-base">Voicemail Detection</CardTitle>
              <CardDescription className="text-sm">
                Automatically detect and leave voicemail messages
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={isLoading}
              aria-label="Toggle voicemail detection"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    When enabled, VAPI will automatically detect voicemail
                    systems and leave a personalized message using your clinic
                    information. The call will end after leaving the message.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>
            <strong>When enabled:</strong> Calls will automatically detect
            voicemail and leave a personalized message.
          </p>
          <p>
            <strong>When disabled:</strong> Calls will attempt normal
            conversation without automatic voicemail detection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
