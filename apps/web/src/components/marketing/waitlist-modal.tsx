"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@odis/ui/dialog";
import { Button } from "@odis/ui/button";
import { Input } from "@odis/ui/input";
import { Label } from "@odis/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis/ui/select";
import { CheckCircle2 } from "lucide-react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { api } from "~/trpc/client";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerLocation?: "navigation" | "hero" | "cta_section";
}

export default function WaitlistModal({
  isOpen,
  onClose,
  triggerLocation = "navigation",
}: WaitlistModalProps) {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    practiceName: "",
    role: "",
  });

  // Tracking refs
  const modalOpenTime = useRef<number | null>(null);
  const formStartTime = useRef<number | null>(null);
  const fieldEditCounts = useRef<Record<string, number>>({});
  const hasFormStarted = useRef(false);

  // Track modal open/close
  useEffect(() => {
    if (isOpen && !modalOpenTime.current) {
      modalOpenTime.current = Date.now();
      posthog.capture("waitlist_modal_opened", {
        trigger_location: triggerLocation,
        device_type: deviceInfo.device_type,
        viewport_width: deviceInfo.viewport_width,
      });
    }
  }, [isOpen, triggerLocation, posthog, deviceInfo]);

  const joinWaitlist = api.waitlist.join.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const formCompletionTime = formStartTime.current
      ? Date.now() - formStartTime.current
      : 0;

    posthog.capture("waitlist_form_submitted", {
      user_role: formData.role,
      has_practice_name: !!formData.practiceName,
      form_completion_time: formCompletionTime,
      device_type: deviceInfo.device_type,
    });

    try {
      setIsSubmitting(true);

      const mutationData = {
        name: formData.name,
        email: formData.email,
        practiceName: formData.practiceName || undefined,
        role: formData.role || undefined,
        campaign: "landing",
        source: triggerLocation || "navigation",
        metadata: {
          practiceName: formData.practiceName || null,
          role: formData.role || null,
        },
      };

      const res = await joinWaitlist.mutateAsync(mutationData);

      setIsSubmitted(true);

      posthog.capture("waitlist_signup_success", {
        user_role: formData.role,
        practice_name: formData.practiceName,
        email_domain: formData.email.split("@")[1],
        device_type: deviceInfo.device_type,
        already_exists:
          res && "alreadyExists" in res
            ? ((res as { alreadyExists?: boolean }).alreadyExists ?? false)
            : false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Waitlist signup error:", err);

      posthog.capture("waitlist_signup_error", {
        error: errorMessage,
        device_type: deviceInfo.device_type,
        form_data: {
          has_name: !!formData.name,
          has_email: !!formData.email,
          has_practice_name: !!formData.practiceName,
          has_role: !!formData.role,
        },
      });

      // Show more specific error message to user
      if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        alert(
          "There was a validation error. Please check your information and try again.",
        );
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("Internal Server Error")
      ) {
        alert("Server error occurred. Please try again later.");
      } else {
        alert("Failed to join waitlist. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    const timeSpentInModal = modalOpenTime.current
      ? Date.now() - modalOpenTime.current
      : 0;

    posthog.capture("waitlist_modal_closed", {
      closed_without_submit: !isSubmitted,
      time_spent_in_modal: timeSpentInModal,
      device_type: deviceInfo.device_type,
    });

    setIsSubmitted(false);
    setFormData({ name: "", email: "", practiceName: "", role: "" });
    modalOpenTime.current = null;
    formStartTime.current = null;
    fieldEditCounts.current = {};
    hasFormStarted.current = false;
    onClose();
  };

  const handleFieldFocus = (fieldName: string) => {
    if (!hasFormStarted.current) {
      hasFormStarted.current = true;
      formStartTime.current = Date.now();
      posthog.capture("waitlist_form_started", {
        form_type: "waitlist_signup",
        device_type: deviceInfo.device_type,
      });
    }

    posthog.capture("form_field_focused", {
      field_name: fieldName,
      form_type: "waitlist_signup",
      device_type: deviceInfo.device_type,
    });
  };

  const handleFieldBlur = (fieldName: string, isRequired: boolean) => {
    const fieldValue = formData[fieldName as keyof typeof formData];
    if (!fieldValue && isRequired) {
      posthog.capture("form_field_blur_empty", {
        field_name: fieldName,
        is_required: isRequired,
        device_type: deviceInfo.device_type,
      });
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    // Track field edits
    fieldEditCounts.current[fieldName] ??= 0;
    fieldEditCounts.current[fieldName]++;

    if (fieldEditCounts.current[fieldName] > 1) {
      posthog.capture("form_field_edited", {
        field_name: fieldName,
        edit_count: fieldEditCounts.current[fieldName],
        device_type: deviceInfo.device_type,
      });
    }

    setFormData({ ...formData, [fieldName]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-gray-900 sm:max-w-md">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-[#1a202c]">
                Join the Waitlist
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  Name *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onFocus={() => handleFieldFocus("name")}
                  onBlur={() => handleFieldBlur("name", true)}
                  placeholder="Your full name"
                  className="placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onFocus={() => handleFieldFocus("email")}
                  onBlur={() => handleFieldBlur("email", true)}
                  placeholder="your@email.com"
                  className="placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practiceName" className="text-gray-700">
                  Practice Name
                </Label>
                <Input
                  id="practiceName"
                  value={formData.practiceName}
                  onChange={(e) =>
                    handleFieldChange("practiceName", e.target.value)
                  }
                  onFocus={() => handleFieldFocus("practiceName")}
                  onBlur={() => handleFieldBlur("practiceName", false)}
                  placeholder="Your practice name"
                  className="placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleFieldChange("role", value)}
                  onOpenChange={(open) => {
                    if (open) {
                      handleFieldFocus("role");
                    }
                  }}
                >
                  <SelectTrigger
                    id="role"
                    className="border-gray-300 bg-white text-gray-900 data-[placeholder]:text-gray-500"
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-300 bg-white">
                    <SelectItem
                      value="veterinarian"
                      className="text-gray-900 hover:bg-gray-100"
                    >
                      Veterinarian
                    </SelectItem>
                    <SelectItem
                      value="practice-manager"
                      className="text-gray-900 hover:bg-gray-100"
                    >
                      Practice Manager
                    </SelectItem>
                    <SelectItem
                      value="technician"
                      className="text-gray-900 hover:bg-gray-100"
                    >
                      Technician
                    </SelectItem>
                    <SelectItem
                      value="other"
                      className="text-gray-900 hover:bg-gray-100"
                    >
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#31aba3] text-white hover:bg-[#2a9a92] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Get Early Access"}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Join waitlist - It&apos;s free →
              </p>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-[#31aba3]" />
            <h3 className="font-display mb-2 text-2xl font-bold text-[#1a202c]">
              Thank you!
            </h3>
            <p className="font-serif text-[#4a5568]">
              We&apos;ll be in touch soon with early access.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
