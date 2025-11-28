"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { CaseListCard } from "./case-list-card";
import { CaseListItemCompact } from "./case-list-item-compact";
import { useQueryState } from "nuqs";
import { CasesFilterBar } from "./cases-filter-bar";
import type { QuickFilterId } from "./quick-filters";
import {
  getDateRangeFromPreset,
  type DateRangePreset,
} from "~/lib/utils/date-ranges";
import type { CaseStatus } from "~/types/dashboard";

type ViewMode = "grid" | "list";
const VIEW_STORAGE_KEY = "cases-view-mode";

/**
 * CasesTab - Display and manage all cases with filtering
 *
 * Note: The `startDate` and `endDate` props are kept for backward compatibility
 * but are ignored. Date filtering is now handled via URL query parameter "dateRange"
 * using the DateFilterButtonGroup component.
 */
export function CasesTab({
  startDate: _startDate,
  endDate: _endDate,
}: {
  /** @deprecated Use dateRange URL query parameter instead */
  startDate?: string | null;
  /** @deprecated Use dateRange URL query parameter instead */
  endDate?: string | null;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [dateRange, setDateRange] = useQueryState("dateRange", {
    defaultValue: "all",
  });

  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "all",
  });

  const [sourceFilter, setSourceFilter] = useQueryState("source", {
    defaultValue: "all",
  });

  const [quickFiltersStr, setQuickFiltersStr] = useQueryState("quickFilters", {
    defaultValue: "",
  });

  // Convert string to Set for easier manipulation
  const quickFilters = useMemo(() => {
    if (!quickFiltersStr) return new Set<QuickFilterId>();
    const validFilterIds: QuickFilterId[] = [
      "missingDischarge",
      "missingSoap",
      "today",
      "thisWeek",
      "recent",
    ];
    return new Set(
      quickFiltersStr
        .split(",")
        .filter(Boolean)
        .filter((id): id is QuickFilterId =>
          validFilterIds.includes(id as QuickFilterId),
        ),
    );
  }, [quickFiltersStr]);

  // Calculate date range from dateRange preset (date-based quick filters removed)
  const { startDate: calculatedStartDate, endDate: calculatedEndDate } =
    useMemo(() => {
      return getDateRangeFromPreset((dateRange as DateRangePreset) ?? "all");
    }, [dateRange]);

  // Convert dates to ISO strings for API calls
  const startDate = calculatedStartDate?.toISOString() ?? null;
  const endDate = calculatedEndDate?.toISOString() ?? null;

  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null;
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  };

  const { data, isLoading } = api.dashboard.getAllCases.useQuery({
    page,
    pageSize: 20,
    status:
      statusFilter && statusFilter !== "all"
        ? (statusFilter as "draft" | "ongoing" | "completed" | "reviewed")
        : undefined,
    source: sourceFilter && sourceFilter !== "all" ? sourceFilter : undefined,
    search: search || undefined,
    startDate,
    endDate,
    missingDischarge: quickFilters.has("missingDischarge") ? true : undefined,
    missingSoap: quickFilters.has("missingSoap") ? true : undefined,
  });

  // Use cases directly from backend (backend handles filtering)
  const filteredCases = data?.cases ?? [];

  return (
    <div className="animate-tab-content space-y-6">
      {/* Header */}
      <div className="animate-card-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            All Cases
          </h2>
          <p className="text-sm text-slate-600">
            Manage and track all your veterinary cases
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="transition-smooth h-8 px-3"
              onClick={() => handleViewModeChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="transition-smooth h-8 px-3"
              onClick={() => handleViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="animate-card-in-delay-1">
        <CasesFilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          quickFilters={quickFilters}
          onQuickFiltersChange={(selected) => {
            const newValue =
              selected.size === 0 ? "" : Array.from(selected).join(",");
            void setQuickFiltersStr(newValue);
            setPage(1);
          }}
          dateRange={(dateRange as DateRangePreset) ?? "all"}
          onDateRangeChange={(preset) => {
            void setDateRange(preset);
            setPage(1);
          }}
          statusFilter={statusFilter ?? "all"}
          onStatusFilterChange={(value) => {
            void setStatusFilter(value === "all" ? null : value);
            setPage(1);
          }}
          sourceFilter={sourceFilter ?? "all"}
          onSourceFilterChange={(value) => {
            void setSourceFilter(value === "all" ? null : value);
            setPage(1);
          }}
          onClearFilters={() => {
            setSearch("");
            void setQuickFiltersStr("");
            void setDateRange("all");
            void setStatusFilter(null);
            void setSourceFilter(null);
            setPage(1);
          }}
        />
      </div>

      {/* Cases List */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[300px] animate-pulse rounded-xl border bg-slate-50"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border bg-slate-50"
              />
            ))}
          </div>
        )
      ) : filteredCases.length === 0 ? (
        <div className="animate-card-in-delay-2 rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-lg font-medium text-slate-900">No cases found</p>
          <p className="mt-1 text-sm text-slate-600">
            {dateRange && dateRange !== "all" ? (
              <>
                No cases found for the selected date range. Try adjusting your
                date filter or create a new case.
              </>
            ) : (
              <>Try adjusting your filters or create a new case</>
            )}
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCases.map((caseData, index) => (
                <CaseListCard
                  key={caseData.id}
                  caseData={{
                    ...caseData,
                    status: (caseData.status ?? "draft") as CaseStatus,
                    created_at: caseData.created_at ?? new Date().toISOString(),
                  }}
                  index={index % 4}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCases.map((caseData) => (
                <CaseListItemCompact
                  key={caseData.id}
                  caseData={{
                    ...caseData,
                    status: (caseData.status ?? "draft") as CaseStatus,
                    created_at: caseData.created_at ?? new Date().toISOString(),
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="animate-card-in-delay-3 flex items-center justify-between pt-4">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * 20 + 1} to{" "}
                {Math.min(page * 20, data.pagination.total)} of{" "}
                {data.pagination.total} cases
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="transition-smooth"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="transition-smooth"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
