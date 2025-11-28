"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Search, Plus, LayoutGrid, List } from "lucide-react";
import { CaseListCard } from "./case-list-card";
import { CaseListItemCompact } from "./case-list-item-compact";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { DateFilterButtonGroup } from "./date-filter-button-group";
import { FilterButtonGroup } from "./filter-button-group";
import {
  getDateRangeFromPreset,
  type DateRangePreset,
} from "~/lib/utils/date-ranges";

type ViewMode = "grid" | "list";
const VIEW_STORAGE_KEY = "cases-view-mode";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "reviewed", label: "Reviewed" },
] as const;

const SOURCE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "manual", label: "Manual" },
  { value: "idexx_neo", label: "IDEXX Neo" },
  { value: "cornerstone", label: "Cornerstone" },
  { value: "ezyvet", label: "ezyVet" },
  { value: "avimark", label: "AVImark" },
] as const;

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

  const [dateRange] = useQueryState("dateRange", {
    defaultValue: "all",
  });

  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "all",
  });

  const [sourceFilter, setSourceFilter] = useQueryState("source", {
    defaultValue: "all",
  });

  const { startDate: calculatedStartDate, endDate: calculatedEndDate } =
    getDateRangeFromPreset((dateRange as DateRangePreset) ?? "all");

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
  });

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
          <Link href="/dashboard/cases?action=new">
            <Button className="transition-smooth gap-2 hover:shadow-md">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="animate-card-in-delay-1 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by patient or owner name..."
            className="transition-smooth pl-9 focus:ring-2"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DateFilterButtonGroup />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <FilterButtonGroup
              options={STATUS_OPTIONS}
              value={statusFilter ?? "all"}
              onChange={(value) => {
                void setStatusFilter(value === "all" ? null : value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Source</label>
            <FilterButtonGroup
              options={SOURCE_OPTIONS}
              value={sourceFilter ?? "all"}
              onChange={(value) => {
                void setSourceFilter(value === "all" ? null : value);
                setPage(1);
              }}
            />
          </div>
        </div>
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
      ) : data?.cases.length === 0 ? (
        <div className="animate-card-in-delay-2 rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-lg font-medium text-slate-900">No cases found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try adjusting your filters or create a new case
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.cases.map((caseData, index) => (
                <div
                  key={caseData.id}
                  className="animate-card-in"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  <CaseListCard caseData={caseData} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.cases.map((caseData, index) => (
                <div
                  key={caseData.id}
                  className="animate-card-in"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  <CaseListItemCompact caseData={caseData} />
                </div>
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
