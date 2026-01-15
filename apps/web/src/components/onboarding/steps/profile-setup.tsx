"use client";

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

const roleOptions = [
  { value: "veterinarian", label: "Veterinarian" },
  { value: "vet_tech", label: "Veterinary Technician" },
  { value: "receptionist", label: "Receptionist" },
  { value: "practice_manager", label: "Practice Manager" },
  { value: "other", label: "Other" },
] as const;

const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
  role: z
    .enum([
      "veterinarian",
      "vet_tech",
      "receptionist",
      "practice_manager",
      "other",
    ])
    .optional(),
  licenseNumber: z.string().max(50).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSetupProps {
  clinicName: string | null;
  onSuccess: (redirectTo: string) => void;
}

export function ProfileSetup({ clinicName, onSuccess }: ProfileSetupProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: undefined,
      licenseNumber: "",
    },
  });

  const completeProfile = api.onboarding.completeProfile.useMutation({
    onSuccess: (data) => {
      if (data.success && data.redirectTo) {
        onSuccess(data.redirectTo);
      }
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await completeProfile.mutateAsync({
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      licenseNumber: data.licenseNumber ?? undefined,
    });
  };

  const watchedRole = watch("role");
  const showLicenseField =
    watchedRole === "veterinarian" || watchedRole === "vet_tech";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-400/20 to-teal-500/10">
          <svg
            className="h-10 w-10 text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          Complete Your Profile
        </h1>
        <p className="mt-3 text-base text-teal-200/80">
          {clinicName
            ? `Almost there! Set up your profile for ${clinicName}`
            : "Almost there! Set up your profile to get started"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="firstName"
              className="text-sm font-medium text-teal-100"
            >
              First Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="firstName"
              {...register("firstName")}
              placeholder="John"
              className={cn(
                "border-white/20 bg-white/10 text-white placeholder:text-teal-300/50",
                "focus:border-teal-400 focus:ring-teal-400/30",
                errors.firstName && "border-red-400/50",
              )}
            />
            {errors.firstName && (
              <p className="text-xs text-red-400">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="lastName"
              className="text-sm font-medium text-teal-100"
            >
              Last Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="lastName"
              {...register("lastName")}
              placeholder="Smith"
              className={cn(
                "border-white/20 bg-white/10 text-white placeholder:text-teal-300/50",
                "focus:border-teal-400 focus:ring-teal-400/30",
                errors.lastName && "border-red-400/50",
              )}
            />
            {errors.lastName && (
              <p className="text-xs text-red-400">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-teal-100">Your Role</Label>
          <Select
            value={watchedRole}
            onValueChange={(value) =>
              setValue("role", value as ProfileFormData["role"])
            }
          >
            <SelectTrigger className="border-white/20 bg-white/10 text-white focus:border-teal-400 focus:ring-teal-400/30">
              <SelectValue placeholder="Select your role (optional)" />
            </SelectTrigger>
            <SelectContent className="border-teal-700 bg-teal-900">
              {roleOptions.map((option) => (
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
            This helps us personalize your experience.
          </p>
        </div>

        {/* License Number (conditional) */}
        {showLicenseField && (
          <div className="space-y-2">
            <Label
              htmlFor="licenseNumber"
              className="text-sm font-medium text-teal-100"
            >
              License Number
            </Label>
            <Input
              id="licenseNumber"
              {...register("licenseNumber")}
              placeholder="e.g., DVM-123456"
              className="border-white/20 bg-white/10 text-white placeholder:text-teal-300/50 focus:border-teal-400 focus:ring-teal-400/30"
            />
            <p className="text-xs text-teal-300/60">
              Optional - for verification purposes
            </p>
          </div>
        )}

        {/* Error Message */}
        {completeProfile.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">
              {completeProfile.error.message ?? "Failed to complete profile"}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full bg-gradient-to-r from-teal-400 to-teal-500 font-semibold text-teal-950",
            "hover:from-teal-300 hover:to-teal-400 disabled:opacity-50",
          )}
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
              Finishing setup...
            </>
          ) : (
            <>
              Complete Setup
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </>
          )}
        </Button>
      </form>

      {/* Privacy note */}
      <p className="text-center text-xs text-teal-300/50">
        Your information is securely stored and will only be used to personalize
        your OdisAI experience.
      </p>
    </div>
  );
}
