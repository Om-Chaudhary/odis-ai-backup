"use server";

import { createClient } from "@odis-ai/db/server";

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    message?: string;
  };
};

export async function submitContactForm(
  prevState: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  const supabase = await createClient();

  // Extract form data
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const clinicName = formData.get("clinicName") as string | null;
  const phone = formData.get("phone") as string | null;
  const message = formData.get("message") as string;

  // Basic validation
  const errors: ContactFormState["errors"] = {};

  if (!firstName || firstName.trim().length === 0) {
    errors.firstName = "First name is required";
  }
  if (!lastName || lastName.trim().length === 0) {
    errors.lastName = "Last name is required";
  }
  if (!email || email.trim().length === 0) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!message || message.trim().length === 0) {
    errors.message = "Message is required";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Please fix the errors below",
      errors,
    };
  }

  // Insert into Supabase
  const { error } = await supabase.from("contact_submissions").insert({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.trim().toLowerCase(),
    clinic_name: clinicName?.trim() ?? null,
    phone: phone?.trim() ?? null,
    message: message.trim(),
    source: "contact_page",
    metadata: {},
  });

  if (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }

  return {
    success: true,
    message: "Thank you for your message! We'll get back to you soon.",
  };
}
