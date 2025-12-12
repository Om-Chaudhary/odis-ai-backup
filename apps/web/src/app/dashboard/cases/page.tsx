"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Redirect from old route /dashboard/cases to new route /admin/discharges
 * This maintains backward compatibility for any bookmarked or shared links
 */
export default function CasesPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/discharges");
  }, [router]);

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
