import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Separator } from "@odis-ai/shared/ui/separator";
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
  showSeparator = true,
}: ClinicInfoSectionProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input
              id="clinicName"
              placeholder="e.g. Happy Paws Veterinary"
              {...register("clinicName", { required: true })}
            />
            {errors.clinicName && (
              <p className="text-destructive text-xs">
                Clinic name is required
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clinicPhone">Phone Number</Label>
            <Input
              id="clinicPhone"
              placeholder="e.g. +1 (555) 123-4567"
              {...register("clinicPhone", { required: true })}
            />
            {errors.clinicPhone && (
              <p className="text-destructive text-xs">
                Phone number is required
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              This number will be displayed to pet owners for follow-up
              questions.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clinicEmail">Email Address</Label>
            <Input
              id="clinicEmail"
              type="email"
              placeholder="e.g. info@happypaws.com"
              {...register("clinicEmail", { required: true })}
            />
            {errors.clinicEmail && (
              <p className="text-destructive text-xs">
                Email address is required
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emergencyPhone">Emergency Phone Number</Label>
            <Input
              id="emergencyPhone"
              placeholder="e.g. +1 (555) 999-8888"
              {...register("emergencyPhone")}
            />
            <p className="text-muted-foreground text-xs">
              Optional emergency contact number for after-hours.
            </p>
          </div>
        </div>
      </div>

      {showSeparator && <Separator />}

      <div className="space-y-4">
        <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Veterinarian Details
        </h4>

        <div className="grid gap-2">
          <Label htmlFor="vetName">Default Veterinarian Name</Label>
          <Input
            id="vetName"
            placeholder="e.g. Dr. Sarah Smith"
            value={settings.vetName}
            disabled
            readOnly
          />
          <p className="text-muted-foreground text-xs">
            This name is computed from your profile (first name + last name) and
            will be used as the sender for discharge emails.
          </p>
        </div>
      </div>
    </>
  );
}
