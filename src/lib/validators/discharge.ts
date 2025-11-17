import { z } from "zod";

/**
 * Validator for generating discharge email content
 */
export const generateEmailSchema = z.object({
  caseId: z.string().uuid("Invalid case ID format"),
  dischargeSummaryId: z
    .string()
    .uuid("Invalid discharge summary ID format")
    .optional(),
});

/**
 * Validator for sending/scheduling discharge email
 */
export const sendEmailSchema = z.object({
  caseId: z.string().uuid("Invalid case ID format").optional(),
  recipientEmail: z.string().email("Invalid email address"),
  recipientName: z.string().min(1, "Recipient name is required").optional(),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  scheduledFor: z.coerce.date({
    required_error: "Scheduled time is required",
    invalid_type_error: "Invalid date format",
  }),
  metadata: z.record(z.any()).optional(),
});

/**
 * Validator for generating discharge summary
 */
export const generateSummarySchema = z.object({
  caseId: z.string().uuid("Invalid case ID format"),
  soapNoteId: z.string().uuid("Invalid SOAP note ID format").optional(),
  templateId: z.string().uuid("Invalid template ID format").optional(),

  // Optional: Raw clinical text for normalization (if case doesn't have entities yet)
  rawInput: z.string().min(50, "Raw input too short for entity extraction").optional(),
  inputType: z.enum(["transcript", "soap_note", "visit_notes", "discharge_summary", "other"]).optional(),

  // VAPI call scheduling details
  ownerPhone: z.string().min(1, "Owner phone number is required"),
  vapiScheduledFor: z.coerce.date({
    required_error: "VAPI call scheduled time is required",
    invalid_type_error: "Invalid date format",
  }),

  // Additional VAPI variables to include in the call
  vapiVariables: z.record(z.any()).optional(),
});

/**
 * Type exports for use in API routes
 */
export type GenerateEmailInput = z.infer<typeof generateEmailSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;
