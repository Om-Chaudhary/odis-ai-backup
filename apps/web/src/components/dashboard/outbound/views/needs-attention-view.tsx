"use client";
import { useState, useCallback } from "react";
import { PageContent, PageFooter } from "~/components/dashboard/layout";
import { OutboundNeedsAttentionTable } from "../outbound-needs-attention-table";
import { DataTablePagination } from "../../shared/data-table/data-table-pagination";
import {
  DashboardSplitLayout,
  type SelectedRowPosition,
} from "../../shared/layouts";
import { OutboundCaseDetail } from "../outbound-case-detail";
import { OutboundHeader, type OutboundHeaderProps } from "../outbound-header";
import type { TransformedCase, DeliveryToggles, ViewMode } from "../types";

interface NeedsAttentionViewProps extends OutboundHeaderProps {
  cases: TransformedCase[];

  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;

  // View Mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  needsAttentionCount: number;
  totalCasesCount: number;

  // Selection & Detail
  selectedCase: TransformedCase | null;
  onSelectCase: (caseItem: TransformedCase) => void;

  onClosePanel: () => void;

  // Detail Actions
  deliveryToggles: DeliveryToggles;
  setDeliveryToggles: (toggles: DeliveryToggles) => void;
  onApprove: (immediate?: boolean) => void;
  onRetry: () => void;
  onPhoneReschedule: (options: {
    delayDays: number;
    immediate: boolean;
  }) => void;
  onEmailReschedule: (options: {
    delayDays: number;
    immediate: boolean;
  }) => void;
  onCancelScheduled: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isSubmitting: boolean;
  isCancellingCall: boolean;
  isCancellingEmail: boolean;
  isRescheduling: boolean;
  testModeEnabled: boolean;
}

export function NeedsAttentionView({
  cases,
  page,
  pageSize,
  total,
  onPageChange,
  viewMode,
  onViewModeChange,
  needsAttentionCount,
  totalCasesCount,
  selectedCase,
  onSelectCase,
  onClosePanel,
  deliveryToggles,
  setDeliveryToggles,
  onApprove,
  onRetry,
  onPhoneReschedule,
  onEmailReschedule,
  onCancelScheduled,
  isSubmitting,
  isCancellingCall,
  isCancellingEmail,
  isRescheduling,
  testModeEnabled,
  ...headerProps
}: NeedsAttentionViewProps) {
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
            totalCount={totalCasesCount}
            needsAttentionCount={needsAttentionCount}
          />
          <PageContent>
            <OutboundNeedsAttentionTable
              cases={cases}
              selectedCaseId={selectedCase?.id ?? null}
              onSelectCase={onSelectCase}
              onToggleCase={handleToggleCase}
              isLoading={headerProps.isLoading}
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
          onPhoneReschedule={onPhoneReschedule}
          onEmailReschedule={onEmailReschedule}
          onCancelScheduled={onCancelScheduled}
          isSubmitting={isSubmitting}
          isCancellingCall={isCancellingCall}
          isCancellingEmail={isCancellingEmail}
          isRescheduling={isRescheduling}
          testModeEnabled={testModeEnabled}
          onDelete={handleClosePanel}
        />
      }
    />
  );
}
