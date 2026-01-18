/**
 * PIMS Provider Registry
 *
 * Manages registration and discovery of PIMS providers.
 */

import type { IPimsProvider, PimsProviderConfig } from "./types";

class PimsProviderRegistry {
  private providers = new Map<string, IPimsProvider>();
  private configs = new Map<string, PimsProviderConfig>();

  /**
   * Register a PIMS provider
   */
  register(provider: IPimsProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(
        `[PIMS Registry] Provider "${provider.name}" is already registered`,
      );
      return;
    }

    this.providers.set(provider.name, provider);

    // Set default config
    if (!this.configs.has(provider.name)) {
      this.configs.set(provider.name, {
        name: provider.name,
        enabled: true,
      });
    }

    console.log(`[PIMS Registry] Registered provider: ${provider.displayName}`);
  }

  /**
   * Unregister a PIMS provider
   */
  unregister(name: string): boolean {
    const provider = this.providers.get(name);
    if (provider) {
      provider.cleanup?.();
      this.providers.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Get a provider by name
   */
  get(name: string): IPimsProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAll(): IPimsProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get the currently active provider based on the current URL
   */
  getActiveProvider(): IPimsProvider | null {
    const currentUrl = window.location.href;

    for (const provider of this.providers.values()) {
      const config = this.configs.get(provider.name);

      // Skip disabled providers
      if (config && !config.enabled) {
        continue;
      }

      // Check if current URL matches provider patterns
      const isMatch = provider.urlPatterns.some((pattern) => {
        const regex = this.patternToRegex(pattern);
        return regex.test(currentUrl);
      });

      if (isMatch && provider.isActive()) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Update provider configuration
   */
  configure(name: string, config: Partial<PimsProviderConfig>): void {
    const existing = this.configs.get(name) ?? { name, enabled: true };
    this.configs.set(name, { ...existing, ...config });
  }

  /**
   * Get provider configuration
   */
  getConfig(name: string): PimsProviderConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * Convert a glob-style URL pattern to a regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i");
  }
}

// Singleton instance
export const pimsRegistry = new PimsProviderRegistry();

// Export class for testing
export { PimsProviderRegistry };
