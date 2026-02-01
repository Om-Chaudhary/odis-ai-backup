/**
 * IDEXX Integration Types
 *
 * Types for IDEXX Neo consultation data including billing items.
 * Used for storing structured billing information from the Chrome extension.
 */

/* ========================================
   Billing Item Types
   ======================================== */

/**
 * Individual billing line item from IDEXX consultation
 */
export interface IdexxBillingItem {
  /** Product or service name */
  productService: string;
  /** Quantity (defaults to 1) */
  quantity: number;
  /** Whether this item was declined by the client */
  isDeclined: boolean;
  /** Price per unit (optional, for future use) */
  price?: number;
  /** Category of the item (optional, e.g., "medication", "procedure", "lab") */
  category?: string;
}

/* ========================================
   Consultation Data Types
   ======================================== */

/**
 * Structured consultation data from IDEXX Neo
 */
export interface IdexxConsultationData {
  /** IDEXX consultation ID */
  consultationId?: string;
  /** Date of consultation */
  consultationDate?: string;
  /** Reason for visit */
  consultationReason?: string;
  /** Clinical notes (may contain HTML) */
  consultationNotes?: string;
  /** All billing line items */
  billingItems: IdexxBillingItem[];
  /** Convenience: only accepted items (isDeclined = false) */
  acceptedItems: IdexxBillingItem[];
  /** Convenience: only declined items (isDeclined = true) */
  declinedItems: IdexxBillingItem[];
}

/* ========================================
   Metadata Types
   ======================================== */

/**
 * IDEXX-specific metadata stored in cases.metadata.idexx
 */
export interface IdexxMetadata {
  /** Raw IDEXX data as received (preserved for debugging/auditing) */
  raw?: Record<string, unknown>;
  /** Parsed and structured consultation data */
  consultation?: IdexxConsultationData;
}

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Parse billing string format into structured items
 * Input format: "Product A; Product B (Qty: 2); Product C"
 *
 * @param billingString - Formatted string from extension
 * @param isDeclined - Whether these items are declined
 * @returns Array of IdexxBillingItem
 */
export function parseBillingString(
  billingString: string | undefined | null,
  isDeclined: boolean,
): IdexxBillingItem[] {
  if (!billingString || billingString.trim() === "") {
    return [];
  }

  return billingString
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      // Parse quantity from format "Product (Qty: 2)"
      const qtyMatch = /\(Qty:\s*(\d+)\)/i.exec(item);
      const quantity = qtyMatch?.[1] ? parseInt(qtyMatch[1], 10) : 1;

      // Remove quantity suffix to get clean product name
      const productService = item.replace(/\s*\(Qty:\s*\d+\)/i, "").trim();

      return {
        productService,
        quantity,
        isDeclined,
      };
    });
}

/**
 * Build IdexxConsultationData from raw IDEXX extension data
 *
 * @param rawData - Raw data from IDEXX extension
 * @returns Structured consultation data
 */
export function buildIdexxConsultationData(
  rawData: Record<string, unknown>,
): IdexxConsultationData {
  const acceptedString = rawData.products_services as string | undefined;
  const declinedString = rawData.declined_products_services as
    | string
    | undefined;

  const acceptedItems = parseBillingString(acceptedString, false);
  const declinedItems = parseBillingString(declinedString, true);

  return {
    // Support both camelCase (from Chrome extension) and snake_case (legacy)
    consultationId: (rawData.consultationId ?? rawData.consultation_id) as
      | string
      | undefined,
    consultationDate: (rawData.consultationDate ??
      rawData.consultation_date ??
      rawData.appointment_date) as string | undefined,
    consultationReason: (rawData.consultationReason ??
      rawData.consultation_reason ??
      rawData.appointment_reason) as string | undefined,
    consultationNotes: rawData.consultation_notes as string | undefined,
    billingItems: [...acceptedItems, ...declinedItems],
    acceptedItems,
    declinedItems,
  };
}
