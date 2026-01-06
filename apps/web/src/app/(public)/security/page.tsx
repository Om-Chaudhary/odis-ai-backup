import type { Metadata } from "next";
import SecurityContent from "~/app/(public)/security/security-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security & Compliance | OdisAI",
  description:
    "Learn about OdisAI's enterprise-grade security measures, HIPAA compliance, and data protection practices for veterinary clinics.",
  alternates: {
    canonical: "/security",
  },
  openGraph: {
    title: "Security at OdisAI",
    description: "Our commitment to protecting your practice data.",
    url: "/security",
  },
};

export default function SecurityPage() {
  return <SecurityContent />;
}
