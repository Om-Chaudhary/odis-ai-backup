"use client";
import { useState, useCallback } from "react";
import { PageContent, PageFooter } from "~/components/dashboard/layout";
import { OutboundCaseTable } from "../outbound-case-table";
import { DataTablePagination } from "../../shared/data-table/data-table-pagination";
import {
  DashboardSplitLayout,
  type SelectedRowPosition,
} from "../../shared/layouts";
import { OutboundCaseDetail } from "../outbound-case-detail";
import { OutboundHeader } from "../outbound-header";
import type { OutboundHeaderProps } from "../outbound-header";
import type { TransformedCase, DeliveryToggles, ViewMode } from "../types";

interface AllDischargesViewProps extends OutboundHeaderProps {
  cases: TransformedCase[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;

  // View Mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  needsAttentionCount: number;

  // Selection & Detail
  selectedCase: TransformedCase | null;
  onSelectCase: (caseItem: TransformedCase) => void;
  onClosePanel: () => void;
  onKeyNavigation: (direction: "up" | "down") => void;

  // Table Actions
  onQuickSchedule: (caseItem: TransformedCase) => void;

  schedulingCaseIds: Set<string>;
  onToggleStar: (caseId: string, starred: boolean) => void;
  togglingStarCaseIds: Set<string>;

  // Bulk Actions
  selectedForBulk: Set<string>;
  onToggleBulkSelect: (caseId: string) => void;
  onSelectAll: () => void;

  // Detail Actions
  deliveryToggles: DeliveryToggles;
  setDeliveryToggles: (toggles: DeliveryToggles) => void;
  onApprove: (immediate?: boolean) => void;
  onRetry: () => void;
  onCancelScheduled: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isSubmitting: boolean;
  isCancelling: boolean; // For current case
  testModeEnabled: boolean;
}

export function AllDischargesView({
  cases,
  page,
  pageSize,
  total,
  onPageChange,
  viewMode,
  onViewModeChange,
  needsAttentionCount,
  selectedCase,
  onSelectCase,
  onClosePanel,
  onKeyNavigation,
  onQuickSchedule,
  schedulingCaseIds,
  onToggleStar,
  togglingStarCaseIds,
  selectedForBulk,
  onToggleBulkSelect,
  onSelectAll,
  deliveryToggles,
  setDeliveryToggles,
  onApprove,
  onRetry,
  onCancelScheduled,
  isSubmitting,
  isCancelling,
  testModeEnabled,
  ...headerProps
}: AllDischargesViewProps) {
  // State for row position (for tab connection effect)
  const [selectedRowPosition, setSelectedRowPosition] =
    useState<SelectedRowPosition | null>(null);

  // Toggle handler: clicking same row closes panel
  const handleToggleCase = useCallback(
    (caseItem: TransformedCase) => {
      if (selectedCase?.id === caseItem.id) {
        onClosePanel();
        setSelectedRowPosition(null);
      }
    },
    [selectedCase?.id, onClosePanel],
  );

  // Wrap onClosePanel to also clear position
  const handleClosePanel = useCallback(() => {
    onClosePanel();
    setSelectedRowPosition(null);
  }, [onClosePanel]);

  return (
    <DashboardSplitLayout
      showRightPanel={selectedCase !== null}
      onCloseRightPanel={handleClosePanel}
      selectedRowPosition={selectedRowPosition}
      leftPanel={
        <>
          <OutboundHeader
            {...headerProps}
            showDateNav={true}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            totalCount={total}
            needsAttentionCount={needsAttentionCount}
          />
          <PageContent>
            <OutboundCaseTable
              cases={cases}
              selectedCaseId={selectedCase?.id ?? null}
              onSelectCase={onSelectCase}
              onToggleCase={handleToggleCase}
              onKeyNavigation={onKeyNavigation}
              isLoading={headerProps.isLoading}
              onQuickSchedule={onQuickSchedule}
              schedulingCaseIds={schedulingCaseIds}
              onToggleStar={onToggleStar}
              togglingStarCaseIds={togglingStarCaseIds}
              selectedForBulk={selectedForBulk}
              onToggleBulkSelect={onToggleBulkSelect}
              onSelectAll={onSelectAll}
              isCompact={selectedCase !== null}
              onSelectedRowPositionChange={setSelectedRowPosition}
            />
          </PageContent>
          <PageFooter>
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          </PageFooter>
        </>
      }
      rightPanel={
        <OutboundCaseDetail
          caseData={selectedCase ?? null}
          deliveryToggles={deliveryToggles}
          onToggleChange={setDeliveryToggles}
          onApprove={onApprove}
          onRetry={onRetry}
          onCancelScheduled={onCancelScheduled}
          isSubmitting={isSubmitting}
          isCancelling={isCancelling}
          testModeEnabled={testModeEnabled}
          onDelete={handleClosePanel}
        />
      }
    />
  );
}
