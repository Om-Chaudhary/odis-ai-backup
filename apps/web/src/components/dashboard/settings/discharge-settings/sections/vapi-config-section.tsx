import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Alert, AlertDescription } from "@odis-ai/ui/alert";
import { Separator } from "@odis-ai/ui/separator";
import { Phone, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/ui/tooltip";
import type { UseFormRegister } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/types";

interface VapiConfigSectionProps {
  register: UseFormRegister<DischargeSettings>;
}

export function VapiConfigSection({ register }: VapiConfigSectionProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure your VAPI phone numbers and assistants for handling inbound
          and outbound calls. These IDs can be found in your{" "}
          <a
            href="https://dashboard.vapi.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            VAPI Dashboard
          </a>
          .
        </AlertDescription>
      </Alert>

      {/* Inbound Call Configuration */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium">
          <Phone className="h-4 w-4" />
          Inbound Call Configuration
        </h3>
        <p className="text-muted-foreground text-sm">
          Configure how incoming calls to your clinic are routed and handled by
          the AI assistant.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="inboundPhoneNumberId">
                Inbound Phone Number ID
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      The VAPI Phone Number ID for receiving inbound calls.
                      Found in VAPI Dashboard → Phone Numbers.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="inboundPhoneNumberId"
              placeholder="e.g. pn_abc123..."
              {...register("inboundPhoneNumberId")}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="inboundAssistantId">Inbound Assistant ID</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      The VAPI Assistant ID for handling inbound calls. Found in
                      VAPI Dashboard → Assistants.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="inboundAssistantId"
              placeholder="e.g. ast_abc123..."
              {...register("inboundAssistantId")}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Outbound Call Configuration */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium">
          <Phone className="h-4 w-4" />
          Outbound Call Configuration
        </h3>
        <p className="text-muted-foreground text-sm">
          Configure the phone number and assistant used for outbound discharge
          follow-up calls. Leave blank to use system defaults.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="outboundPhoneNumberId">
                Outbound Phone Number ID
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      The VAPI Phone Number ID for outbound caller ID. This
                      number will appear on the pet owner&apos;s phone.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="outboundPhoneNumberId"
              placeholder="e.g. pn_xyz789..."
              {...register("outboundPhoneNumberId")}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="outboundAssistantId">Outbound Assistant ID</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      The VAPI Assistant ID for outbound discharge calls. Leave
                      blank to use the shared system assistant.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="outboundAssistantId"
              placeholder="e.g. ast_xyz789..."
              {...register("outboundAssistantId")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
