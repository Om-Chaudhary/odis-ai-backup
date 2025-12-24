import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";

interface BrandingSectionProps {
  register: UseFormRegister<DischargeSettings>;
  watch: UseFormWatch<DischargeSettings>;
  setValue: UseFormSetValue<DischargeSettings>;
}

export function BrandingSection({
  register,
  watch,
  setValue,
}: BrandingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-5">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="primaryColor">Primary Brand Color</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    This color is used for the email header background, buttons,
                    and accent elements in discharge emails.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="primaryColor"
              type="color"
              className="h-10 w-16 cursor-pointer p-1"
              {...register("primaryColor")}
            />
            <Input
              type="text"
              placeholder="#2563EB"
              className="flex-1 font-mono"
              value={watch("primaryColor") ?? "#2563EB"}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                  setValue("primaryColor", value || "#2563EB", {
                    shouldDirty: true,
                  });
                }
              }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Used for headers, buttons, and accents in discharge emails.
          </p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    URL to your clinic logo image. The logo will appear in the
                    header of discharge emails. Recommended size: 200x60 pixels.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://example.com/logo.png"
            {...register("logoUrl")}
          />
          <p className="text-muted-foreground text-xs">
            Optional: Display your clinic logo in email headers.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="emailHeaderText">Custom Header Text</Label>
          <Input
            id="emailHeaderText"
            placeholder="Thank you for trusting us with your pet's care!"
            {...register("emailHeaderText")}
          />
          <p className="text-muted-foreground text-xs">
            Optional: Custom welcome message for discharge emails.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="emailFooterText">Custom Footer Text</Label>
          <Input
            id="emailFooterText"
            placeholder="Questions? Call us at (555) 123-4567"
            {...register("emailFooterText")}
          />
          <p className="text-muted-foreground text-xs">
            Optional: Custom footer message for discharge emails.
          </p>
        </div>
      </div>
    </div>
  );
}
