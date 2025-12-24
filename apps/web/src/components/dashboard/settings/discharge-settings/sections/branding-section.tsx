import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Palette, Info, Image, Type } from "lucide-react";
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
  const primaryColor = watch("primaryColor") ?? "#2563EB";

  return (
    <div className="space-y-8">
      {/* Brand Colors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pink-100/80 text-pink-600">
            <Palette className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-medium text-slate-700">Brand Colors</h4>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="primaryColor"
              className="text-sm font-medium text-slate-700"
            >
              Primary Brand Color
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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
              className="h-10 w-14 cursor-pointer overflow-hidden rounded-md border border-slate-200 p-1"
              {...register("primaryColor")}
            />
            <Input
              type="text"
              placeholder="#2563EB"
              className="max-w-32 border-slate-200 font-mono text-sm focus:border-teal-400 focus:ring-teal-400/20"
              value={primaryColor}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                  setValue("primaryColor", value || "#2563EB", {
                    shouldDirty: true,
                  });
                }
              }}
            />
            <div
              className="h-10 w-10 shrink-0 rounded-md border border-slate-200"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Used for headers, buttons, and accents in discharge emails.
          </p>
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-100/80 text-cyan-600">
            <Image className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-medium text-slate-700">Logo</h4>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="logoUrl"
              className="text-sm font-medium text-slate-700"
            >
              Logo URL
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
            className="max-w-lg border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            {...register("logoUrl")}
          />
        </div>
      </div>

      {/* Custom Text */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-100/80 text-orange-600">
            <Type className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-medium text-slate-700">Custom Text</h4>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="emailHeaderText"
                className="text-sm font-medium text-slate-700"
              >
                Header Text
              </Label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Optional
              </span>
            </div>
            <Input
              id="emailHeaderText"
              placeholder="Thank you for trusting us..."
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("emailHeaderText")}
            />
            <p className="text-xs text-slate-500">
              Custom welcome message for discharge emails.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="emailFooterText"
                className="text-sm font-medium text-slate-700"
              >
                Footer Text
              </Label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Optional
              </span>
            </div>
            <Input
              id="emailFooterText"
              placeholder="Questions? Call us at..."
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("emailFooterText")}
            />
            <p className="text-xs text-slate-500">
              Custom footer message for discharge emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
