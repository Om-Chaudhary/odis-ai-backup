import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { PostHogProvider } from "posthog-js/react";

/**
 * Custom render function that wraps components with required providers
 */
function customRender(ui: ReactElement, options?: RenderOptions) {
  // Create a mock PostHog client
  const mockPostHogClient = {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    isFeatureEnabled: vi.fn(() => false),
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  };

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <PostHogProvider client={mockPostHogClient as any}>
        {children}
      </PostHogProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };

/**
 * Utility to mock window dimensions for responsive testing
 */
export function mockWindowDimensions(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event("resize"));
}

/**
 * Utility to wait for animations to complete
 */
export function waitForAnimation(duration = 100) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Utility to trigger scroll events
 */
export function triggerScroll(scrollY: number) {
  Object.defineProperty(window, "scrollY", {
    writable: true,
    configurable: true,
    value: scrollY,
  });

  Object.defineProperty(window, "pageYOffset", {
    writable: true,
    configurable: true,
    value: scrollY,
  });

  window.dispatchEvent(new Event("scroll"));
}
