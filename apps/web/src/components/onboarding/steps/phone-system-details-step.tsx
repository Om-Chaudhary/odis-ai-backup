"use client";

import { Input, Label } from "@odis-ai/shared/ui";
import { Info } from "lucide-react";
import {
  PHONE_SYSTEM_LABELS,
  type PhoneSystemType,
} from "~/app/api/onboarding/schemas";

interface PhoneSystemDetailsStepProps {
  phoneSystemType: PhoneSystemType;
  providerName: string;
  contactInfo: string;
  details: string;
  onProviderNameChange: (value: string) => void;
  onContactInfoChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onSkip: () => void;
}

/**
 * Step 4 (non-Weave): Phone System Details
 *
 * Collects provider contact info for OTTO, Mitel, or Other phone systems.
 * All fields are skippable.
 */
export function PhoneSystemDetailsStep({
  phoneSystemType,
  providerName,
  contactInfo,
  details,
  onProviderNameChange,
  onContactInfoChange,
  onDetailsChange,
  onSkip,
}: PhoneSystemDetailsStepProps) {
  const label = PHONE_SYSTEM_LABELS[phoneSystemType];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {phoneSystemType === "other"
            ? "Tell Us About Your Phone System"
            : `${label} Phone System Details`}
        </h2>
        <p className="mt-2 text-slate-600">
          Share your phone system provider details so our team can coordinate
          setup.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">We'll reach out to coordinate</p>
            <p className="mt-1">
              Our team will use this information to work with your phone
              provider to set up call handling.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider-name">
            {phoneSystemType === "other"
              ? "Phone System Name"
              : "Provider Contact Name"}
          </Label>
          <Input
            id="provider-name"
            type="text"
            placeholder={
              phoneSystemType === "other"
                ? "e.g., RingCentral, Vonage, etc."
                : `Your ${label} account rep or contact name`
            }
            value={providerName}
            onChange={(e) => onProviderNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-info">Contact Info</Label>
          <Input
            id="contact-info"
            type="text"
            placeholder="Email or phone number for your provider contact"
            value={contactInfo}
            onChange={(e) => onContactInfoChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone-details">Additional Notes</Label>
          <textarea
            id="phone-details"
            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Any additional details about your phone setup..."
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-slate-500 underline hover:text-slate-700"
      >
        Skip for now - I'll provide these later
      </button>
    </div>
  );
}
