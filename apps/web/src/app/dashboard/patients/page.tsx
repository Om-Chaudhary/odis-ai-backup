import {
  DashboardPageHeader,
  DashboardToolbar,
} from "~/components/dashboard/shared";
import { PageContainer, PageContent } from "~/components/dashboard/layout";
import { Users } from "lucide-react";

export default function PatientsPage() {
  return (
    <PageContainer>
      <DashboardPageHeader
        title="Patients"
        subtitle="Patient directory and management"
        icon={Users}
      >
        <DashboardToolbar
          showDateNav={false}
          searchTerm=""
          searchPlaceholder="Search patients..."
          isLoading={false}
          className="w-full"
        />
      </DashboardPageHeader>

      <PageContent>
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">
            Patient Directory
          </h3>
          <p className="max-w-sm text-sm">
            This page will list all patients with options to filter, search, and
            view detailed profiles.
          </p>
        </div>
      </PageContent>
    </PageContainer>
  );
}
