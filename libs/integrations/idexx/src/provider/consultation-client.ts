/**
 * IDEXX Neo Consultation Client
 * Fetches consultation/SOAP note details via page-data API
 */

import type { Page } from "playwright";
import type { PimsConsultation } from "@odis-ai/shared/types";
import type { BrowserPool } from "../browser/browser-pool";
import type { IdexxAuthClient } from "./auth-client";
import { IDEXX_ENDPOINTS } from "./types";
import { withRetry, isRetryableError } from "../browser/retry";

/** Error types for consultation fetch operations */
export type ConsultationErrorType =
  | "network"
  | "auth"
  | "not_found"
  | "unknown";

/** Result of a single consultation fetch */
export interface ConsultationFetchResult {
  consultation: PimsConsultation | null;
  error?: {
    type: ConsultationErrorType;
    message: string;
  };
}

/** Stats from batch consultation fetch */
export interface ConsultationBatchStats {
  total: number;
  successful: number;
  failed: number;
  networkErrors: number;
  notFound: number;
}

/** Result of batch consultation fetch */
export interface ConsultationBatchResult {
  consultations: Map<string, PimsConsultation>;
  errors: Map<string, { type: ConsultationErrorType; message: string }>;
  stats: ConsultationBatchStats;
}

/** Configuration for consultation client */
export interface ConsultationClientConfig {
  /** Delay between requests in milliseconds (default: 200) */
  requestDelayMs?: number;
  /** Batch size for parallel fetches (default: 2) */
  batchSize?: number;
}

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
 * Uses BrowserPool for efficient resource management
 */
export class IdexxConsultationClient {
  private config: Required<ConsultationClientConfig>;

  constructor(
    private browserPool: BrowserPool,
    private authClient: IdexxAuthClient,
    private baseUrl: string,
    config: ConsultationClientConfig = {},
  ) {
    this.config = {
      requestDelayMs: config.requestDelayMs ?? 200,
      batchSize: config.batchSize ?? 2,
    };
  }

  /**
   * Fetch consultation details by ID
   * Uses pooled browser context with retry logic for transient errors
   */
  async fetchConsultation(
    consultationId: string,
  ): Promise<ConsultationFetchResult> {
    if (!this.authClient.isAuthenticated()) {
      return {
        consultation: null,
        error: { type: "auth", message: "Not authenticated" },
      };
    }

    const url = `${this.baseUrl}${IDEXX_ENDPOINTS.CONSULTATION(consultationId)}`;

    // Use browser pool with retry for transient network errors
    const result = await withRetry(
      async () => {
        return this.browserPool.withAuthenticatedPage(
          this.authClient,
          async (session) => {
            return this.fetchConsultationFromApi(
              session.page,
              url,
              consultationId,
            );
          },
        );
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        onRetry: (error, attempt, delayMs) => {
          console.log(
            `[ConsultationClient] Retrying consultation ${consultationId} (attempt ${attempt}, delay ${delayMs}ms):`,
            error instanceof Error ? error.message : error,
          );
        },
      },
    );

    if (result.success && result.data) {
      return { consultation: result.data };
    }

    // Classify the error
    const errorType = this.classifyError(result.error);
    const errorMessage =
      result.error instanceof Error ? result.error.message : "Unknown error";

    return {
      consultation: null,
      error: { type: errorType, message: errorMessage },
    };
  }

  /**
   * Classify error type for proper handling/tracking
   */
  private classifyError(error: unknown): ConsultationErrorType {
    if (!error) return "unknown";
    if (isRetryableError(error)) return "network";

    const message = this.getErrorMessage(error).toLowerCase();

    if (
      message.includes("not authenticated") ||
      message.includes("session expired") ||
      message.includes("401")
    ) {
      return "auth";
    }

    if (
      message.includes("404") ||
      message.includes("not found") ||
      message.includes("invalid consultation")
    ) {
      return "not_found";
    }

    return "unknown";
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return JSON.stringify(error);
  }

  /**
   * Fetch consultation from IDEXX API using page context
   */
  private async fetchConsultationFromApi(
    page: Page,
    url: string,
    consultationId: string,
  ): Promise<PimsConsultation | null> {
    // IMPORTANT: Navigate to IDEXX domain first so fetch() is same-origin
    // Without this, fetch() from about:blank is cross-origin and blocked by CORS
    await page.goto(this.baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

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
    if (!lines?.length) return null;

    const filtered = lines.filter((line) =>
      declinedOnly ? line.isDeclined : !line.isDeclined,
    );
    if (filtered.length === 0) return null;

    return filtered
      .map((line) => {
        if (line.quantity && line.quantity !== 1) {
          return `${line.productService} (Qty: ${line.quantity})`;
        }
        return line.productService;
      })
      .join("; ");
  }

  /**
   * Batch fetch consultations with proper error tracking
   * Uses reduced parallelism and inter-request delays to prevent resource exhaustion
   */
  async fetchConsultations(
    consultationIds: string[],
  ): Promise<ConsultationBatchResult> {
    const consultations = new Map<string, PimsConsultation>();
    const errors = new Map<
      string,
      { type: ConsultationErrorType; message: string }
    >();
    const stats: ConsultationBatchStats = {
      total: consultationIds.length,
      successful: 0,
      failed: 0,
      networkErrors: 0,
      notFound: 0,
    };

    const { batchSize, requestDelayMs } = this.config;

    // Process in small batches to limit concurrent browser contexts
    for (let i = 0; i < consultationIds.length; i += batchSize) {
      const batch = consultationIds.slice(i, i + batchSize);

      // Fetch batch in parallel (limited concurrency)
      const batchResults = await Promise.all(
        batch.map(async (id) => {
          const result = await this.fetchConsultation(id);
          return { id, result };
        }),
      );

      // Process results
      for (const { id, result } of batchResults) {
        if (result.consultation) {
          consultations.set(id, result.consultation);
          stats.successful++;
        } else if (result.error) {
          errors.set(id, result.error);
          stats.failed++;

          // Track specific error types
          if (result.error.type === "network") {
            stats.networkErrors++;
          } else if (result.error.type === "not_found") {
            stats.notFound++;
          }
        }
      }

      const processed = Math.min(i + batchSize, consultationIds.length);
      const isLastBatch = processed >= consultationIds.length;

      // Inter-batch delay to prevent resource exhaustion
      if (!isLastBatch) {
        await new Promise((resolve) => setTimeout(resolve, requestDelayMs));
      }

      // Log progress every 10 items or on completion
      if (processed % 10 === 0 || isLastBatch) {
        console.log(
          `[ConsultationClient] Progress: ${processed}/${consultationIds.length}`,
          `(success: ${stats.successful}, failed: ${stats.failed}, network: ${stats.networkErrors})`,
        );
        console.log(
          "[ConsultationClient] Pool stats:",
          this.browserPool.getStats(),
        );
      }
    }

    return { consultations, errors, stats };
  }
}
