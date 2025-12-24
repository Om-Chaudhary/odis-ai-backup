import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Building2, Phone, Mail, AlertCircle, User } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";

interface ClinicInfoSectionProps {
  register: UseFormRegister<DischargeSettings>;
  errors: FieldErrors<DischargeSettings>;
  settings: DischargeSettings;
  showSeparator?: boolean;
}

export function ClinicInfoSection({
  register,
  errors,
  settings,
}: ClinicInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Clinic Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100/80 text-teal-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">
              Clinic Details
            </h4>
            <p className="text-xs text-slate-500">
              Basic information about your clinic
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-teal-100/60 bg-white/50 p-4 backdrop-blur-sm">
          <div className="grid gap-2">
            <Label
              htmlFor="clinicName"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Clinic Name
            </Label>
            <Input
              id="clinicName"
              placeholder="e.g. Happy Paws Veterinary"
              className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("clinicName", { required: true })}
            />
            {errors.clinicName && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                Clinic name is required
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="clinicPhone"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Phone Number
            </Label>
            <Input
              id="clinicPhone"
              placeholder="e.g. +1 (555) 123-4567"
              className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("clinicPhone", { required: true })}
            />
            {errors.clinicPhone && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                Phone number is required
              </p>
            )}
            <p className="text-xs text-slate-500">
              This number will be displayed to pet owners for follow-up
              questions.
            </p>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="clinicEmail"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email Address
            </Label>
            <Input
              id="clinicEmail"
              type="email"
              placeholder="e.g. info@happypaws.com"
              className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("clinicEmail", { required: true })}
            />
            {errors.clinicEmail && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                Email address is required
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="emergencyPhone"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Phone className="h-3.5 w-3.5 text-red-400" />
              Emergency Phone Number
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Optional
              </span>
            </Label>
            <Input
              id="emergencyPhone"
              placeholder="e.g. +1 (555) 999-8888"
              className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("emergencyPhone")}
            />
            <p className="text-xs text-slate-500">
              Optional emergency contact number for after-hours.
            </p>
          </div>
        </div>
      </div>

      {/* Veterinarian Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-600">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">
              Veterinarian Details
            </h4>
            <p className="text-xs text-slate-500">
              Information about the primary veterinarian
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-teal-100/60 bg-white/50 p-4 backdrop-blur-sm">
          <div className="grid gap-2">
            <Label
              htmlFor="vetName"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              Default Veterinarian Name
            </Label>
            <Input
              id="vetName"
              placeholder="e.g. Dr. Sarah Smith"
              value={settings.vetName}
              disabled
              readOnly
              className="border-slate-200 bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500">
              This name is computed from your profile (first name + last name)
              and will be used as the sender for discharge emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
