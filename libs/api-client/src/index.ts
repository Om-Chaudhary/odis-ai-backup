/**
 * @odis/api-client
 *
 * REST API client for non-Next.js applications (Electron, Chrome extension, React Native).
 * Wraps the Next.js REST API routes for type-safe consumption.
 *
 * PLACEHOLDER: To be implemented when Electron/extension apps are added.
 */

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string>;
}

/**
 * Create an API client instance
 * @param config - Configuration object with baseUrl and token provider
 */
export function createApiClient(config: ApiClientConfig) {
  // Placeholder implementation
  return {
    cases: {
      list: async () => {
        throw new Error("Not implemented");
      },
      get: async (_id: string) => {
        throw new Error("Not implemented");
      },
    },
    // Add more endpoints as needed
  };
}
