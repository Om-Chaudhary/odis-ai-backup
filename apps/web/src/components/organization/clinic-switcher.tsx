"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

/**
 * Clinic Switcher Component
 *
 * Uses Clerk's OrganizationSwitcher to allow users to:
 * - Switch between clinics (organizations)
 * - Create new clinics
 * - Manage current clinic settings
 *
 * Maps Clerk organizations to ODIS AI clinics.
 */
export function ClinicSwitcher() {
  return (
    <OrganizationSwitcher
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger: "w-full justify-between",
        },
      }}
      afterSelectOrganizationUrl="/dashboard"
      afterCreateOrganizationUrl="/onboarding/clinic"
      hidePersonal={true} // Hide personal account, only show organizations
    />
  );
}
