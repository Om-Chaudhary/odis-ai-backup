"use client";

import type { Database } from "@odis-ai/shared/types";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface AdminContextValue {
  selectedClinicId: string | null; // null = all clinics (global view)
  selectedClinic: Clinic | null;
  clinics: Clinic[];
  isGlobalView: boolean;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
  clinics: Clinic[];
}

/**
 * Extract clinic slug from pathname
 * e.g., /dashboard/alum-rock-animal-hospital/admin/sync -> alum-rock-animal-hospital
 */
function getClinicSlugFromPathname(pathname: string): string | null {
  const match = /^\/dashboard\/([^/]+)/.exec(pathname);
  return match?.[1] ?? null;
}

export function AdminProvider({ children, clinics }: AdminProviderProps) {
  const pathname = usePathname();

  // Derive selected clinic from URL path (single source of truth)
  const { selectedClinicId, selectedClinic } = useMemo(() => {
    const slug = getClinicSlugFromPathname(pathname);

    // DEBUG: Log what's happening
    console.log("[AdminProvider] pathname:", pathname);
    console.log("[AdminProvider] extracted slug:", slug);
    console.log(
      "[AdminProvider] available clinics:",
      clinics.map((c) => c.slug),
    );

    if (!slug) {
      return { selectedClinicId: null, selectedClinic: null };
    }

    const clinic = clinics.find((c) => c.slug === slug);
    console.log("[AdminProvider] found clinic:", clinic?.name, clinic?.id);
    return {
      selectedClinicId: clinic?.id ?? null,
      selectedClinic: clinic ?? null,
    };
  }, [pathname, clinics]);

  const isGlobalView = selectedClinicId === null;

  return (
    <AdminContext.Provider
      value={{
        selectedClinicId,
        selectedClinic,
        clinics,
        isGlobalView,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return context;
}
