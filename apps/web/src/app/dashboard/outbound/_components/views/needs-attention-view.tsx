import { PageContent, PageFooter } from "~/components/dashboard/layout";
import { OutboundNeedsAttentionTable } from "../outbound-needs-attention-table";
import { OutboundPagination } from "../outbound-pagination";
import { OutboundSplitLayout } from "../outbound-split-layout";
import { OutboundCaseDetail } from "../outbound-case-detail";
import { OutboundHeader } from "../outbound-header";
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
  return (
    <OutboundSplitLayout
      showRightPanel={selectedCase !== null}
      onCloseRightPanel={onClosePanel}
      leftPanel={
        <>
          <OutboundHeader {...headerProps} showDateNav={false} />
          <PageContent>
            <OutboundNeedsAttentionTable
              cases={cases}
              selectedCaseId={selectedCase?.id ?? null}
              onSelectCase={onSelectCase}
              isLoading={headerProps.isLoading}
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
          caseData={selectedCase ?? undefined}
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
