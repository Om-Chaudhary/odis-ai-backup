"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { DischargeSettings } from "~/types/dashboard";

interface DischargeSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DischargeSettings;
  onSave: (settings: DischargeSettings) => void;
  isLoading?: boolean;
}

export function DischargeSettingsPanel({
  open,
  onOpenChange,
  settings,
  onSave,
  isLoading = false,
}: DischargeSettingsPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<DischargeSettings>({
    defaultValues: settings,
  });

  useEffect(() => {
    if (open) {
      reset(settings);
    }
  }, [open, settings, reset]);

  const onSubmit = (data: DischargeSettings) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Discharge Settings</DialogTitle>
          <DialogDescription>
            Configure your clinic details and vet information. These will be
            used in discharge communications with pet owners.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 px-4">
            <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Clinic Information
            </h4>

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

          <Separator />

          <div className="space-y-4 px-4">
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
                This name is computed from your profile (first name + last name)
                and will be used as the sender for discharge emails.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
