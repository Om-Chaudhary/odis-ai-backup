import type { Metadata } from "next";
import SupportContent from "~/app/(public)/support/support-content";
import { getPublicPageRobots } from "~/lib/metadata";

export const metadata: Metadata = {
  title: "Support Hub | Get Help with OdisAI",
  description:
    "Find answers, learn best practices, and get the support you need to make the most of OdisAI for your veterinary practice.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "OdisAI Support Hub",
    description: "Support resources for OdisAI users.",
    url: "/support",
  },
  robots: getPublicPageRobots(),
};

export default function SupportPage() {
  return <SupportContent />;
}
