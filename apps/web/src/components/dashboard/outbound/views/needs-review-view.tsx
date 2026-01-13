import {
  PageContainer,
  PageContent,
  PageFooter,
} from "~/components/dashboard/layout";
import { OutboundNeedsReviewTable } from "../outbound-needs-review-table";
import { OutboundPagination } from "../outbound-pagination";
import { OutboundHeader } from "../outbound-header";
import type { OutboundHeaderProps } from "../outbound-header";
import type { TransformedCase } from "../types";

interface NeedsReviewViewProps extends OutboundHeaderProps {
  cases: TransformedCase[];

  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onUpdateContact: (
    caseId: string,
    field: "phone" | "email",
    value: string,
  ) => Promise<void>;
}

export function NeedsReviewView({
  cases,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onUpdateContact,
  ...headerProps
}: NeedsReviewViewProps) {
  return (
    <PageContainer className="h-full">
      <OutboundHeader {...headerProps} showDateNav={true} />
      <PageContent>
        <OutboundNeedsReviewTable
          cases={cases}
          isLoading={headerProps.isLoading}
          onUpdateContact={onUpdateContact}
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
    </PageContainer>
  );
}
