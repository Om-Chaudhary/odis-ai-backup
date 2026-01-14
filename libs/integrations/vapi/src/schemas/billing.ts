/**
 * Billing-related Tool Schemas
 *
 * Schemas for billing inquiries and payment questions.
 */

import { z } from "zod";

/* ========================================
   Enums
   ======================================== */

/**
 * Billing inquiry type
 */
export const BillingInquiryTypeEnum = z.enum([
  "balance_question",
  "payment_plan",
  "insurance",
  "estimate_request",
  "refund",
  "other",
]);
export type BillingInquiryType = z.infer<typeof BillingInquiryTypeEnum>;

/* ========================================
   Log Billing Inquiry
   ======================================== */

/**
 * Schema: log_billing_inquiry
 *
 * Log a billing or payment-related question.
 * Used by Admin Agent to record billing inquiries.
 */
export const LogBillingInquirySchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Billing inquiry details
  inquiry_type: BillingInquiryTypeEnum,
  details: z.string().min(1, "details is required"),
  visit_date: z.string().optional(),
});

export type LogBillingInquiryInput = z.infer<typeof LogBillingInquirySchema>;
