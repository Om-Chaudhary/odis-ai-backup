"use client";

import { useEffect, useState } from "react";
import { useOrganizationList, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * Client component that auto-selects the user's organization if they have one.
 * Renders nothing visible - just handles the org selection logic.
 */
export function AutoSelectOrg() {
  const router = useRouter();
  const { orgId } = useAuth();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    // Already has active org - redirect to dashboard
    if (orgId) {
      router.replace("/dashboard");
      return;
    }

    if (!isLoaded || attempted) return;

    const memberships = userMemberships.data ?? [];

    // No organizations - stay on pending page
    if (memberships.length === 0) {
      return;
    }

    // Has at least one org - auto-select the first one
    setAttempted(true);
    const membership = memberships[0];
    if (!membership) return;
    setActive?.({ organization: membership.organization.id })
      .then(() => {
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("Failed to set active org:", err);
      });
  }, [isLoaded, orgId, userMemberships.data, setActive, router, attempted]);

  // This component renders nothing
  return null;
}
