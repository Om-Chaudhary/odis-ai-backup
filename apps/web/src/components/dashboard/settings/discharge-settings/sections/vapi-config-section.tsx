import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { PhoneIncoming, PhoneOutgoing, Info, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import type { UseFormRegister } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";

interface VapiConfigSectionProps {
  register: UseFormRegister<DischargeSettings>;
}

export function VapiConfigSection({ register }: VapiConfigSectionProps) {
  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-100/80 text-teal-600">
            <Info className="h-3.5 w-3.5" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-slate-700">
              VAPI Configuration
            </h5>
            <p className="text-xs text-slate-500">
              Configure your VAPI phone numbers and assistants. IDs can be found
              in your{" "}
              <a
                href="https://dashboard.vapi.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-teal-600 underline decoration-teal-400/50 underline-offset-2 hover:text-teal-700"
              >
                VAPI Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Inbound Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100/80 text-green-600">
            <PhoneIncoming className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-medium text-slate-700">
            Inbound Call Configuration
          </h4>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="inboundPhoneNumberId"
                className="text-sm font-medium text-slate-700"
              >
                Phone Number ID
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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
              className="border-slate-200 font-mono text-sm focus:border-teal-400 focus:ring-teal-400/20"
              {...register("inboundPhoneNumberId")}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="inboundAssistantId"
                className="text-sm font-medium text-slate-700"
              >
                Assistant ID
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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
              className="border-slate-200 font-mono text-sm focus:border-teal-400 focus:ring-teal-400/20"
              {...register("inboundAssistantId")}
            />
          </div>
        </div>
      </div>

      {/* Outbound Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100/80 text-blue-600">
            <PhoneOutgoing className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-medium text-slate-700">
            Outbound Call Configuration
          </h4>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="outboundPhoneNumberId"
                className="text-sm font-medium text-slate-700"
              >
                Phone Number ID
              </Label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Optional
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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
              className="border-slate-200 font-mono text-sm focus:border-teal-400 focus:ring-teal-400/20"
              {...register("outboundPhoneNumberId")}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="outboundAssistantId"
                className="text-sm font-medium text-slate-700"
              >
                Assistant ID
              </Label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Optional
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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
              className="border-slate-200 font-mono text-sm focus:border-teal-400 focus:ring-teal-400/20"
              {...register("outboundAssistantId")}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Leave blank to use system defaults for discharge follow-up calls.
        </p>
      </div>
    </div>
  );
}
