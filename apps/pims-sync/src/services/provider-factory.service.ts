/**
 * Provider Factory Service
 *
 * Centralized factory for creating IDEXX provider instances with credentials.
 * Eliminates duplication across main.ts, sync.route.ts, and appointments.route.ts.
 *
 * Now includes session caching to reduce authentication frequency from ~20+/day
 * to 2-3/day per clinic.
 */

import type { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import type { PimsCredentials } from "@odis-ai/domain/sync";
import { PersistenceService } from "./persistence.service";
import { SessionCacheService } from "./session-cache.service";
import { config } from "../config";
import { logger } from "../lib/logger";

const providerLogger = logger.child("provider-factory");

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
  /** User ID who owns the credentials (needed for AI generation) */
  userId: string;
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
  const { BrowserService } =
    await import("@odis-ai/integrations/idexx/browser");
  const { IdexxProvider } =
    await import("@odis-ai/integrations/idexx/provider");

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
    const sessionCache = new SessionCacheService();

    // Check for cached session BEFORE authenticating
    const cachedSession = await sessionCache.getValidSession(clinicId);

    if (cachedSession) {
      // Try to restore session from cache
      const restored = await provider.restoreSession(cachedSession.cookies);

      if (restored) {
        // Touch session to prevent idle timeout
        await sessionCache.touchSession(clinicId);
        providerLogger.info(`Restored cached session for clinic ${clinicId}`);
      } else {
        // Cache was stale, delete and re-authenticate
        providerLogger.info(
          `Cached session stale for clinic ${clinicId}, re-authenticating`,
        );
        await sessionCache.deleteSession(clinicId);
        await authenticateAndCache(
          provider,
          credentials,
          clinicId,
          sessionCache,
        );
      }
    } else {
      // No cache, authenticate fresh
      providerLogger.info(
        `No cached session for clinic ${clinicId}, authenticating fresh`,
      );
      await authenticateAndCache(provider, credentials, clinicId, sessionCache);
    }

    return {
      provider,
      credentials,
      cleanup: async () => {
        // Touch session on cleanup to extend idle timeout
        await sessionCache.touchSession(clinicId).catch(() => {
          // Ignore touch errors on cleanup - session may already be invalid
        });
        await provider.close();
      },
      userId: credentialResult.userId,
    };
  }

  return {
    provider,
    credentials,
    cleanup: async () => {
      await provider.close();
    },
    userId: credentialResult.userId,
  };
}

/**
 * Authenticate with PIMS and cache the session
 */
async function authenticateAndCache(
  provider: IdexxProvider,
  credentials: PimsCredentials,
  clinicId: string,
  sessionCache: SessionCacheService,
): Promise<void> {
  const authenticated = await provider.authenticate(credentials);
  if (!authenticated) {
    await provider.close();
    throw new Error("PIMS authentication failed");
  }

  // Cache the new session
  const cookies = provider.getSessionCookies();
  if (cookies) {
    await sessionCache.saveSession(clinicId, cookies);
    providerLogger.info(`Cached new session for clinic ${clinicId}`);
  }
}
