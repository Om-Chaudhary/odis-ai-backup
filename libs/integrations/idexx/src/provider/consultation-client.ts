/**
 * IDEXX Neo Consultation Client
 * Fetches consultation/SOAP note details via page-data API
 */

import type { Page } from "playwright";
import type { PimsConsultation } from "@odis-ai/shared/types";
import type { BrowserService } from "../browser/browser-service";
import type { IdexxAuthClient } from "./auth-client";
import { IDEXX_ENDPOINTS } from "./types";

/**
 * IDEXX consultation line item (product/service)
 */
interface IdexxConsultationLine {
  id: number;
  productService: string;
  quantity: number;
  isDeclined?: boolean;
}

/**
 * IDEXX consultation page-data response structure
 * Based on actual API response from /consultations/{id}/page-data
 */
interface IdexxConsultationPageData {
  consultation: {
    id: number;
    reason: string;
    notes: string;
    dischargeSummary?: string;
    date: string;
    status: string;
  };
  patient: {
    id: number;
    name: string;
    species: string;
    breed: string;
  };
  client: {
    id: number;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  pageData: {
    providers: Array<{
      id: number;
      name: string;
      email: string;
      licenseNumber: string;
      userType: string;
      companyId: number;
    }>;
  };
  clientBranch?: {
    id: number;
    name: string;
  };
  consultationNotes?: {
    notes?: string;
  };
  consultationLines?: IdexxConsultationLine[];
}

/**
 * Client for fetching consultation data from IDEXX Neo
 */
export class IdexxConsultationClient {
  constructor(
    private browserService: BrowserService,
    private authClient: IdexxAuthClient,
    private baseUrl: string,
  ) {}

  /**
   * Fetch consultation details by ID
   */
  async fetchConsultation(
    consultationId: string,
  ): Promise<PimsConsultation | null> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("consultation");
    const { page } = session;

    try {
      // Apply authentication
      await this.authClient.applyAuth(page);

      // Build consultation page-data URL
      const url = `${this.baseUrl}${IDEXX_ENDPOINTS.CONSULTATION(consultationId)}`;

      // Fetch via page context
      const consultation = await this.fetchConsultationFromApi(
        page,
        url,
        consultationId,
      );

      return consultation;
    } catch (error) {
      console.error(`Failed to fetch consultation ${consultationId}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Fetch consultation from IDEXX API using page context
   */
  private async fetchConsultationFromApi(
    page: Page,
    url: string,
    consultationId: string,
  ): Promise<PimsConsultation | null> {
    // Use page.evaluate to make fetch with authenticated session
    const response = await page.evaluate(async (apiUrl: string) => {
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    }, url);

    const typedResponse = response as Partial<IdexxConsultationPageData>;
    if (!typedResponse?.consultation) {
      console.warn("Invalid consultation response:", response);
      return null;
    }

    return this.mapConsultationData(
      typedResponse as IdexxConsultationPageData,
      consultationId,
    );
  }

  /**
   * Map IDEXX consultation data to PimsConsultation
   */
  private mapConsultationData(
    data: IdexxConsultationPageData,
    consultationId: string,
  ): PimsConsultation {
    // Extract discharge summary - check multiple locations
    // Priority: dischargeSummary > consultationNotes.notes > consultation.notes
    const dischargeSummary =
      data.consultation.dischargeSummary ??
      data.consultationNotes?.notes ??
      null;

    // Extract consultation notes (separate from discharge summary)
    const notes = data.consultation.notes || null;

    // Format products/services
    const productsServices = this.formatProductsServices(
      data.consultationLines,
      false,
    );
    const declinedProductsServices = this.formatProductsServices(
      data.consultationLines,
      true,
    );

    return {
      id: consultationId,
      notes,
      dischargeSummary,
      productsServices,
      declinedProductsServices,
      status: data.consultation.status || "unknown",
      reason: data.consultation.reason || null,
      date: data.consultation.date || null,
    };
  }

  /**
   * Format consultation line items into a readable string
   */
  private formatProductsServices(
    lines: IdexxConsultationLine[] | undefined,
    declinedOnly: boolean,
  ): string | null {
    if (!lines || lines.length === 0) {
      return null;
    }

    const filtered = lines.filter((line) =>
      declinedOnly ? line.isDeclined : !line.isDeclined,
    );

    if (filtered.length === 0) {
      return null;
    }

    return filtered
      .map((line) => {
        const parts = [line.productService];
        if (line.quantity && line.quantity !== 1) {
          parts.push(`(Qty: ${line.quantity})`);
        }
        return parts.join(" ");
      })
      .join("; ");
  }

  /**
   * Batch fetch consultations
   */
  async fetchConsultations(
    consultationIds: string[],
  ): Promise<Map<string, PimsConsultation>> {
    const results = new Map<string, PimsConsultation>();

    // Fetch consultations in parallel (with limit)
    const BATCH_SIZE = 5;
    for (let i = 0; i < consultationIds.length; i += BATCH_SIZE) {
      const batch = consultationIds.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (id) => {
          const consultation = await this.fetchConsultation(id);
          return { id, consultation };
        }),
      );

      for (const { id, consultation } of batchResults) {
        if (consultation) {
          results.set(id, consultation);
        }
      }
    }

    return results;
  }
}
