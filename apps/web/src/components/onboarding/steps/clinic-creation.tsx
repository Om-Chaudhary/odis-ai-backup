"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/client";
import { cn } from "@odis-ai/shared/util";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";

const pimsOptions = [
  { value: "idexx_neo", label: "IDEXX Neo" },
  { value: "ezyvet", label: "ezyVet" },
  { value: "shepherd", label: "Shepherd" },
  { value: "provet", label: "ProVet Cloud" },
  { value: "other", label: "Other" },
  { value: "none", label: "None / Manual Entry" },
] as const;

const timezoneOptions = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
] as const;

const defaultBusinessHours = {
  monday: { open: "09:00", close: "17:00", closed: false },
  tuesday: { open: "09:00", close: "17:00", closed: false },
  wednesday: { open: "09:00", close: "17:00", closed: false },
  thursday: { open: "09:00", close: "17:00", closed: false },
  friday: { open: "09:00", close: "17:00", closed: false },
  saturday: { open: "09:00", close: "13:00", closed: false },
  sunday: { open: "09:00", close: "13:00", closed: true },
};

const clinicCreationSchema = z.object({
  name: z
    .string()
    .min(2, "Clinic name must be at least 2 characters")
    .max(100, "Clinic name must be at most 100 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().max(500, "Address too long").optional(),
  timezone: z.string().min(1, "Timezone is required"),
  pimsType: z.enum([
    "idexx_neo",
    "ezyvet",
    "shepherd",
    "provet",
    "other",
    "none",
  ]),
});

type ClinicFormData = z.infer<typeof clinicCreationSchema>;

interface ClinicCreationProps {
  onSuccess: (clinic: { id: string; name: string; slug: string }) => void;
  onBack: () => void;
}

export function ClinicCreation({ onSuccess, onBack }: ClinicCreationProps) {
  const [showBusinessHours, setShowBusinessHours] = useState(false);
  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicCreationSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      timezone: "America/Los_Angeles",
      pimsType: "none",
    },
  });

  const createClinic = api.onboarding.createClinic.useMutation({
    onSuccess: (data) => {
      if (data.success && data.clinic) {
        onSuccess(data.clinic);
      }
    },
  });

  const onSubmit = async (data: ClinicFormData) => {
    await createClinic.mutateAsync({
      name: data.name,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
      address: data.address ?? undefined,
      timezone: data.timezone,
      pimsType: data.pimsType,
      businessHours: showBusinessHours ? businessHours : undefined,
    });
  };

  const updateBusinessHour = (
    day: keyof typeof businessHours,
    field: "open" | "close" | "closed",
    value: string | boolean,
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const watchedTimezone = watch("timezone");
  const watchedPimsType = watch("pimsType");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          Create Your Clinic
        </h1>
        <p className="mt-3 text-base text-teal-200/80">
          Tell us about your veterinary practice
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Clinic Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-teal-100">
            Clinic Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Sunrise Animal Hospital"
            className={cn(
              "border-white/20 bg-white/10 text-white placeholder:text-teal-300/50",
              "focus:border-teal-400 focus:ring-teal-400/30",
              errors.name && "border-red-400/50",
            )}
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium tracking-wider text-teal-200/70 uppercase">
            Contact Information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-teal-100"
              >
                Phone
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                type="tel"
                placeholder="(555) 123-4567"
                className="border-white/20 bg-white/10 text-white placeholder:text-teal-300/50 focus:border-teal-400 focus:ring-teal-400/30"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-teal-100"
              >
                Email
              </Label>
              <Input
                id="email"
                {...register("email")}
                type="email"
                placeholder="clinic@example.com"
                className={cn(
                  "border-white/20 bg-white/10 text-white placeholder:text-teal-300/50",
                  "focus:border-teal-400 focus:ring-teal-400/30",
                  errors.email && "border-red-400/50",
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-sm font-medium text-teal-100"
            >
              Address
            </Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main St, City, State 12345"
              className="border-white/20 bg-white/10 text-white placeholder:text-teal-300/50 focus:border-teal-400 focus:ring-teal-400/30"
            />
          </div>
        </div>

        {/* PIMS Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-teal-100">
            Practice Management System (PIMS)
          </Label>
          <Select
            value={watchedPimsType}
            onValueChange={(value) =>
              setValue("pimsType", value as ClinicFormData["pimsType"])
            }
          >
            <SelectTrigger className="border-white/20 bg-white/10 text-white focus:border-teal-400 focus:ring-teal-400/30">
              <SelectValue placeholder="Select your PIMS" />
            </SelectTrigger>
            <SelectContent className="border-teal-700 bg-teal-900">
              {pimsOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white hover:bg-teal-800 focus:bg-teal-800"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-teal-300/60">
            This helps us tailor the integration experience for your practice.
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-teal-100">
            Timezone <span className="text-red-400">*</span>
          </Label>
          <Select
            value={watchedTimezone}
            onValueChange={(value) => setValue("timezone", value)}
          >
            <SelectTrigger className="border-white/20 bg-white/10 text-white focus:border-teal-400 focus:ring-teal-400/30">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="border-teal-700 bg-teal-900">
              {timezoneOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white hover:bg-teal-800 focus:bg-teal-800"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Hours Toggle */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowBusinessHours(!showBusinessHours)}
            className="flex items-center gap-2 text-sm font-medium text-teal-200/70 transition-colors hover:text-teal-100"
          >
            <svg
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                showBusinessHours && "rotate-90",
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span>Business Hours (optional)</span>
          </button>

          {showBusinessHours && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              {(
                Object.keys(businessHours) as Array<keyof typeof businessHours>
              ).map((day) => (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-teal-200/80 capitalize">
                    {day.slice(0, 3)}
                  </span>

                  <div
                    className={cn(
                      "flex flex-1 items-center gap-2 transition-opacity",
                      businessHours[day].closed && "opacity-40",
                    )}
                  >
                    <Input
                      type="time"
                      value={businessHours[day].open}
                      onChange={(e) =>
                        updateBusinessHour(day, "open", e.target.value)
                      }
                      disabled={businessHours[day].closed}
                      className="w-28 border-white/20 bg-white/10 text-xs text-white focus:border-teal-400 focus:ring-teal-400/30"
                    />
                    <span className="text-teal-300/60">to</span>
                    <Input
                      type="time"
                      value={businessHours[day].close}
                      onChange={(e) =>
                        updateBusinessHour(day, "close", e.target.value)
                      }
                      disabled={businessHours[day].closed}
                      className="w-28 border-white/20 bg-white/10 text-xs text-white focus:border-teal-400 focus:ring-teal-400/30"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={businessHours[day].closed}
                      onChange={(e) =>
                        updateBusinessHour(day, "closed", e.target.checked)
                      }
                      className="rounded border-white/20 bg-white/10 text-teal-500 focus:ring-teal-400/30"
                    />
                    <span className="text-xs text-teal-200/70">Closed</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {createClinic.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">
              {createClinic.error.message ?? "Failed to create clinic"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="text-teal-200/70 hover:bg-white/10 hover:text-white"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-teal-400 to-teal-500 font-semibold text-teal-950 hover:from-teal-300 hover:to-teal-400 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </>
            ) : (
              <>
                Create Clinic
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
