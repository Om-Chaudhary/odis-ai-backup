"use client";

import type { Database } from "@odis-ai/shared/types";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface AdminContextValue {
  selectedClinicId: string | null; // null = all clinics (global view)
  clinics: Clinic[];
  setSelectedClinic: (id: string | null) => void;
  isGlobalView: boolean;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
  clinics: Clinic[];
}

const STORAGE_KEY = "admin_selected_clinic_id";

export function AdminProvider({ children, clinics }: AdminProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL query param, then localStorage, then null (global view)
  const [selectedClinicId, setSelectedClinicIdState] = useState<string | null>(
    () => {
      if (typeof window === "undefined") return null;

      const urlClinicId = searchParams.get("clinic");
      if (urlClinicId) return urlClinicId;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "null") return null;
      return stored;
    },
  );

  // Sync URL query param with state
  useEffect(() => {
    const urlClinicId = searchParams.get("clinic");
    const currentId = selectedClinicId;

    if (urlClinicId !== currentId) {
      if (urlClinicId) {
        setSelectedClinicIdState(urlClinicId);
      } else if (!urlClinicId && currentId !== null) {
        // URL doesn't have clinic param but state does - update URL
        updateUrl(currentId);
      }
    }
  }, [searchParams]);

  const updateUrl = (clinicId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (clinicId) {
      params.set("clinic", clinicId);
    } else {
      params.delete("clinic");
    }

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url, { scroll: false });
  };

  const setSelectedClinic = (id: string | null) => {
    setSelectedClinicIdState(id);

    // Persist to localStorage
    if (typeof window !== "undefined") {
      if (id === null) {
        localStorage.setItem(STORAGE_KEY, "null");
      } else {
        localStorage.setItem(STORAGE_KEY, id);
      }
    }

    // Update URL
    updateUrl(id);
  };

  const isGlobalView = selectedClinicId === null;

  return (
    <AdminContext.Provider
      value={{
        selectedClinicId,
        clinics,
        setSelectedClinic,
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
