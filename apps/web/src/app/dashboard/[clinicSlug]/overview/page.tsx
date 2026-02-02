import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageContent } from "~/components/dashboard/layout";
import { OverviewClient } from "~/components/dashboard/overview";

interface OverviewPageProps {
  params: Promise<{ clinicSlug: string }>;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { clinicSlug } = await params;

  return (
    <PageContainer>
      <PageContent className="p-0">
        <OverviewClient clinicSlug={clinicSlug} />
      </PageContent>
    </PageContainer>
  );
}
