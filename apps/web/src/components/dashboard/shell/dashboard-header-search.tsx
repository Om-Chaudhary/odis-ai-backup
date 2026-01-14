"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { useEffect, useState } from "react";

/**
 * Dashboard Header Search
 *
 * A global search input that syncs with URL query parameters.
 * Only shown on inbound and outbound pages.
 */
export function DashboardHeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Only show search on inbound and outbound pages
  const showSearch =
    pathname.includes("/inbound") || pathname.includes("/outbound");

  // Sync with URL search param
  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    setSearchTerm(urlSearch);
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Update URL with debouncing
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Cmd+K handler
  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[data-search="dashboard-search"]',
        );
        searchInput?.focus();
      }
    };
    document.addEventListener("keydown", handleCmdK);
    return () => document.removeEventListener("keydown", handleCmdK);
  }, []);

  if (!showSearch) {
    return null;
  }

  return (
    <div className="relative w-64">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        data-search="dashboard-search"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        className={cn(
          "h-8 w-full rounded-md border border-teal-200/50 bg-white/80 pr-12 pl-9 text-sm",
          "placeholder:text-slate-400",
          "transition-all duration-200",
          "hover:border-teal-300/60 hover:bg-white",
          "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
        )}
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-400 sm:inline-block">
        ⌘K
      </kbd>
    </div>
  );
}
