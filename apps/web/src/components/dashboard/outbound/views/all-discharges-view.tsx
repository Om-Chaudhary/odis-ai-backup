import { PageContent, PageFooter } from "~/components/dashboard/layout";
import { OutboundCaseTable } from "../outbound-case-table";
import { OutboundPagination } from "../outbound-pagination";
import { OutboundSplitLayout } from "../outbound-split-layout";
import { OutboundCaseDetail } from "../outbound-case-detail";
import { OutboundHeader } from "../outbound-header";
import type { OutboundHeaderProps } from "../outbound-header";
import type { TransformedCase, DeliveryToggles } from "../types";

interface AllDischargesViewProps extends OutboundHeaderProps {
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
  onPageSizeChange,
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
  return (
    <OutboundSplitLayout
      showRightPanel={selectedCase !== null}
      onCloseRightPanel={onClosePanel}
      header={<OutboundHeader {...headerProps} showDateNav={true} />}
      leftPanel={
        <>
          <PageContent>
            <OutboundCaseTable
              cases={cases}
              selectedCaseId={selectedCase?.id ?? null}
              onSelectCase={onSelectCase}
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
            />
          </PageContent>
          <PageFooter>
            <OutboundPagination
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
          onDelete={onClosePanel}
        />
      }
    />
  );
}
