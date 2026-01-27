/**
 * Provider Factory Service
 *
 * Centralized factory for creating IDEXX provider instances with credentials.
 * Eliminates duplication across main.ts, sync.route.ts, and appointments.route.ts.
 */

import type { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import type { PimsCredentials } from "@odis-ai/domain/sync";
import { PersistenceService } from "./persistence.service";
import { config } from "../config";

/**
 * Options for provider creation
 */
export interface ProviderFactoryOptions {
  /**
   * Whether to authenticate immediately after creating the provider.
   * Default: false (caller handles authentication)
   */
  authenticate?: boolean;
}

/**
 * Result of provider creation
 */
export interface ProviderFactoryResult {
  provider: IdexxProvider;
  credentials: PimsCredentials;
  cleanup: () => Promise<void>;
}

/**
 * Create IDEXX provider for a clinic
 *
 * @param clinicId - Clinic ID
 * @param options - Factory options
 * @returns Provider, credentials, and cleanup function
 * @throws Error if credentials not found or authentication fails (when authenticate=true)
 */
export async function createProviderForClinic(
  clinicId: string,
  options: ProviderFactoryOptions = {},
): Promise<ProviderFactoryResult> {
  const { authenticate = false } = options;

  // Get credentials
  const persistence = new PersistenceService();
  const credentialResult = await persistence.getClinicCredentials(clinicId);

  if (!credentialResult) {
    throw new Error(`No credentials found for clinic ${clinicId}`);
  }

  // Import browser and provider
  // Import from specific submodules to avoid pulling in credential-manager which has "server-only" imports
  const { BrowserService } = await import("@odis-ai/integrations/idexx/browser");
  const { IdexxProvider } = await import("@odis-ai/integrations/idexx/provider");

  // Create browser service
  const browserService = new BrowserService({
    headless: config.HEADLESS,
    defaultTimeout: config.SYNC_TIMEOUT_MS,
  });

  // Launch browser
  await browserService.launch();

  // Create provider
  const provider = new IdexxProvider({
    browserService,
    debug: config.NODE_ENV === "development",
  });

  // Map credentials to PIMS format
  const credentials: PimsCredentials = {
    username: credentialResult.credentials.username,
    password: credentialResult.credentials.password,
    companyId: credentialResult.credentials.companyId,
  };

  // Authenticate if requested
  if (authenticate) {
    const authenticated = await provider.authenticate(credentials);
    if (!authenticated) {
      await provider.close();
      throw new Error("PIMS authentication failed");
    }
  }

  return {
    provider,
    credentials,
    cleanup: async () => {
      await provider.close();
    },
  };
}
