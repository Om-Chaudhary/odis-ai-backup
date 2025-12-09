/**
 * React testing utilities
 *
 * Provides helpers for testing React components with proper providers
 */
import React, { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Create a new QueryClient configured for testing
 * - Disables retries for predictable test behavior
 * - Disables refetch on window focus
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Default test providers wrapper
 * Includes QueryClientProvider and can be extended
 */
export function TestProviders({
  children,
  queryClient = createTestQueryClient(),
}: TestProvidersProps): ReactElement {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with test providers
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />);
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders queryClient={queryClient}>{children}</TestProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Wait for async operations in tests
 * Useful for waiting for React Query to settle
 */
export async function waitForQueryToSettle(ms = 0): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-export commonly used testing library utilities
export {
  screen,
  fireEvent,
  waitFor,
  within,
  act,
  cleanup,
} from "@testing-library/react";

export { default as userEvent } from "@testing-library/user-event";
