"use client";
import { useState, useCallback } from "react";
import { PageContent, PageFooter } from "~/components/dashboard/layout";
import { OutboundNeedsAttentionTable } from "../outbound-needs-attention-table";
import { DataTablePagination } from "../../shared/data-table/data-table-pagination";
import {
  OutboundSplitLayout,
  type SelectedRowPosition,
} from "../outbound-split-layout";
import { OutboundCaseDetail } from "../outbound-case-detail";
import type { OutboundHeaderProps } from "../outbound-header";
import type { TransformedCase, DeliveryToggles } from "../types";

interface NeedsAttentionViewProps extends OutboundHeaderProps {
  cases: TransformedCase[];

  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  // Selection & Detail
  selectedCase: TransformedCase | null;
  onSelectCase: (caseItem: TransformedCase) => void;

  onClosePanel: () => void;

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
  isCancelling: boolean;
  testModeEnabled: boolean;
}

export function NeedsAttentionView({
  cases,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  selectedCase,
  onSelectCase,
  onClosePanel,
  deliveryToggles,
  setDeliveryToggles,
  onApprove,
  onRetry,
  onCancelScheduled,
  isSubmitting,
  isCancelling,
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
    <OutboundSplitLayout
      showRightPanel={selectedCase !== null}
      onCloseRightPanel={handleClosePanel}
      selectedRowPosition={selectedRowPosition}
      leftPanel={
        <>
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
              onPageSizeChange={onPageSizeChange}
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
