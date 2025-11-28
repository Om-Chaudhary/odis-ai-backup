"use client";

import { useParams } from "next/navigation";
import { CaseDetailClient } from "~/components/dashboard/case-detail-client";

export default function DischargeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) {
    return <div>Loading...</div>;
  }

  return <CaseDetailClient caseId={id} />;
}
