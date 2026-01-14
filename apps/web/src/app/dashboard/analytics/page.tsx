import {
  DashboardPageHeader,
  DashboardToolbar,
} from "~/components/dashboard/shared";
import { PageContainer, PageContent } from "~/components/dashboard/layout";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <DashboardPageHeader
        title="Analytics"
        subtitle="Performance metrics and call statistics"
        icon={BarChart3}
      >
        <DashboardToolbar
          showDateNav={true}
          currentDate={new Date()}
          isDateLoading={false}
          className="w-full"
        />
      </DashboardPageHeader>

      <PageContent>
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <BarChart3 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">
            Analytics Dashboard
          </h3>
          <p className="max-w-sm text-sm">
            This page will display detailed analytics about call performance,
            outcomes, and volume over time.
          </p>
        </div>
      </PageContent>
    </PageContainer>
  );
}
