"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
import { CaseListItemComponent } from "./case-list-item";
import Link from "next/link";

export function CasesTab({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();

  const { data, isLoading } = api.dashboard.getAllCases.useQuery({
    page,
    pageSize: 20,
    status: statusFilter as
      | "draft"
      | "ongoing"
      | "completed"
      | "reviewed"
      | undefined,
    source: sourceFilter,
    search: search || undefined,
    startDate,
    endDate,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            All Cases
          </h2>
          <p className="text-sm text-slate-600">
            Manage and track all your veterinary cases
          </p>
        </div>
        <Link href="/dashboard/cases?action=new">
          <Button className="transition-smooth gap-2 hover:shadow-md">
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="animate-fade-in-up stagger-1 flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <div className="flex gap-2">
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sourceFilter ?? "all"}
            onValueChange={(value) => {
              setSourceFilter(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="idexx_neo">IDEXX Neo</SelectItem>
              <SelectItem value="cornerstone">Cornerstone</SelectItem>
              <SelectItem value="ezyvet">ezyVet</SelectItem>
              <SelectItem value="avimark">AVImark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border bg-slate-50"
            />
          ))}
        </div>
      ) : data?.cases.length === 0 ? (
        <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-lg font-medium text-slate-900">No cases found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try adjusting your filters or create a new case
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data?.cases.map((caseData, index) => (
              <div
                key={caseData.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CaseListItemComponent caseData={caseData} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="animate-fade-in-up stagger-5 flex items-center justify-between pt-4">
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
