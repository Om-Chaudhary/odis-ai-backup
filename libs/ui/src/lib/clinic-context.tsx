"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Database } from "@odis-ai/types";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicContextValue {
  clinic: Clinic;
  clinicId: string;
  clinicSlug: string;
  clinicName: string;
}

const ClinicContext = createContext<ClinicContextValue | null>(null);

interface ClinicProviderProps {
  children: ReactNode;
  clinic: Clinic;
}

/**
 * ClinicProvider - Provides clinic context to dashboard routes
 *
 * Wraps clinic-scoped routes and provides access to the current clinic's
 * data throughout the component tree.
 *
 * @example
 * ```tsx
 * // In a component:
 * const { clinic, clinicSlug } = useClinic();
 * ```
 */
export function ClinicProvider({ children, clinic }: ClinicProviderProps) {
  const value: ClinicContextValue = {
    clinic,
    clinicId: clinic.id,
    clinicSlug: clinic.slug,
    clinicName: clinic.name,
  };

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  );
}

/**
 * useClinic - Hook to access current clinic context
 *
 * Must be used within a ClinicProvider (i.e., within clinic-scoped routes).
 *
 * @throws Error if used outside of ClinicProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { clinic, clinicSlug, clinicName } = useClinic();
 *   return <div>Welcome to {clinicName}</div>;
 * }
 * ```
 */
export function useClinic(): ClinicContextValue {
  const context = useContext(ClinicContext);

  if (!context) {
    throw new Error("useClinic must be used within a ClinicProvider");
  }

  return context;
}

/**
 * useOptionalClinic - Hook to optionally access clinic context
 *
 * Returns null if not within a ClinicProvider. Useful for components
 * that can work both inside and outside clinic-scoped routes.
 *
 * @example
 * ```tsx
 * function SharedComponent() {
 *   const clinicContext = useOptionalClinic();
 *   const clinicName = clinicContext?.clinicName ?? "No Clinic";
 *   return <div>{clinicName}</div>;
 * }
 * ```
 */
export function useOptionalClinic(): ClinicContextValue | null {
  return useContext(ClinicContext);
}

/**
 * Helper to build clinic-scoped URLs
 *
 * @param clinicSlug - The clinic's URL slug
 * @param path - The path within the clinic scope (e.g., "/discharges")
 * @returns Full clinic-scoped URL
 *
 * @example
 * ```ts
 * const url = buildClinicUrl("alum-rock", "/discharges");
 * // Returns: "/dashboard/alum-rock/discharges"
 * ```
 */
export function buildClinicUrl(clinicSlug: string, path = ""): string {
  const basePath = `/dashboard/${clinicSlug}`;
  if (!path || path === "/") {
    return basePath;
  }
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
