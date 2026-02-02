import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageContent } from "~/components/dashboard/layout";

export default async function OverviewPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PageContainer>
      <PageContent className="p-6">
        <h1>Overview</h1>
      </PageContent>
    </PageContainer>
  );
}
