"use client";

import { useState, useRef, useCallback } from "react";
import { useQueryState } from "nuqs";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Input } from "@odis-ai/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import {
  Phone,
  LayoutGrid,
  List,
  Search,
  RefreshCw,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  DateFilterBar,
  CallTriageTable,
  CallKanban,
  categories,
} from "~/components/admin/discharge-calls";
import type { ReviewCategory } from "~/server/api/routers/admin-discharge-calls";

type ViewMode = "table" | "kanban";

export function DischargeCallsTriageClient() {
  // URL state for persistence
  const [viewMode, setViewMode] = useQueryState("view", {
    defaultValue: "table" as ViewMode,
  });
  const [categoryFilter, setCategoryFilter] = useQueryState("category", {
    defaultValue: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Date filter state
  const [dateRange, setDateRange] = useState<{
    startDate: string | undefined;
    endDate: string | undefined;
  }>({
    startDate: undefined,
    endDate: undefined,
  });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Audio player state
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch calls
  const {
    data: callsData,
    isLoading,
    refetch,
  } = api.adminDischargeCalls.listDischargeCalls.useQuery({
    page: 1,
    pageSize: 100, // Get all calls for pilot triage
    reviewCategory: categoryFilter
      ? (categoryFilter as ReviewCategory)
      : undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    search: searchQuery || undefined,
  });

  // Fetch stats
  const { data: statsData, refetch: refetchStats } =
    api.adminDischargeCalls.getTriageStats.useQuery();

  // Update mutation
  const updateCategoryMutation =
    api.adminDischargeCalls.updateReviewCategory.useMutation({
      onSuccess: () => {
        void refetch();
        void refetchStats();
      },
      onError: (error) => {
        toast.error(`Failed to update: ${error.message}`);
      },
    });

  // Bulk update mutation
  const bulkUpdateMutation =
    api.adminDischargeCalls.bulkUpdateReviewCategory.useMutation({
      onSuccess: (result) => {
        toast.success(`Updated ${result.updatedCount} calls`);
        setSelectedIds(new Set());
        void refetch();
        void refetchStats();
      },
      onError: (error) => {
        toast.error(`Failed to bulk update: ${error.message}`);
      },
    });

  const handleCategoryChange = useCallback(
    (callId: string, category: ReviewCategory) => {
      updateCategoryMutation.mutate({ callId, reviewCategory: category });
    },
    [updateCategoryMutation],
  );

  const handleBulkCategoryChange = (category: ReviewCategory) => {
    if (selectedIds.size === 0) {
      toast.warning("No calls selected");
      return;
    }
    bulkUpdateMutation.mutate({
      callIds: Array.from(selectedIds),
      reviewCategory: category,
    });
  };

  const handlePlayAudio = (callId: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setCurrentPlayingId(callId);
    void audio.play();
    audio.onended = () => {
      setCurrentPlayingId(null);
    };
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentPlayingId(null);
  };

  const handleRefresh = () => {
    void refetch();
    void refetchStats();
    toast.success("Data refreshed");
  };

  const calls = callsData?.calls ?? [];
  const isUpdating =
    updateCategoryMutation.isPending || bulkUpdateMutation.isPending;

  return (
    <div className="-m-8 flex h-[calc(100vh-2rem)] flex-col">
      {/* Header - Compact */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-1.5">
            <Phone className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">
              Discharge Calls Triage
            </h1>
            <p className="text-xs text-slate-500">
              {statsData
                ? `${statsData.reviewed} of ${statsData.total} reviewed (${statsData.reviewedPercentage}%)`
                : "Loading..."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-slate-700 hover:text-slate-900"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters Bar - Compact */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-2">
        {/* View Toggle */}
        <Tabs
          value={viewMode ?? "table"}
          onValueChange={(v) => setViewMode(v as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date Filter */}
        <DateFilterBar value={dateRange} onChange={setDateRange} />

        {/* Category Filter */}
        <Select
          value={categoryFilter ?? "all"}
          onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search patient, owner, or transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex shrink-0 items-center gap-4 border-b border-teal-200 bg-teal-50 px-6 py-2">
          <CheckSquare className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-800">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkCategoryChange("good")}
              disabled={isUpdating}
              className="h-7 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              Good
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkCategoryChange("bad")}
              disabled={isUpdating}
              className="h-7 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            >
              Bad
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkCategoryChange("voicemail")}
              disabled={isUpdating}
              className="h-7 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              VM
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="h-7"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Main Content - Full Height Scrollable */}
      <div className="flex-1 overflow-auto bg-white">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : viewMode === "kanban" ? (
          <div className="h-full p-4">
            <CallKanban
              calls={calls}
              onCategoryChange={handleCategoryChange}
              isUpdating={isUpdating}
              onPlayAudio={handlePlayAudio}
              currentPlayingId={currentPlayingId}
              onStopAudio={handleStopAudio}
            />
          </div>
        ) : (
          <CallTriageTable
            calls={calls}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onCategoryChange={handleCategoryChange}
            isUpdating={isUpdating}
            currentPlayingId={currentPlayingId}
            onPlayAudio={handlePlayAudio}
            onStopAudio={handleStopAudio}
          />
        )}
      </div>

      {/* Keyboard Shortcuts - Fixed Footer */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-2 text-xs text-slate-500">
        <strong className="text-slate-600">Shortcuts:</strong>
        <span className="ml-3">
          <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow">
            G
          </kbd>{" "}
          Good
        </span>
        <span className="ml-2">
          <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow">
            B
          </kbd>{" "}
          Bad
        </span>
        <span className="ml-2">
          <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow">
            V
          </kbd>{" "}
          VM
        </span>
        <span className="ml-2">
          <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow">
            F
          </kbd>{" "}
          Failed
        </span>
        <span className="ml-2">
          <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow">
            N
          </kbd>{" "}
          No Ans
        </span>
        <span className="ml-2">
          <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow">
            U
          </kbd>{" "}
          F/U
        </span>
      </div>
    </div>
  );
}
