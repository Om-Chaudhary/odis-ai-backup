import type { Metadata } from "next";
import { DemoContent } from "./demo-content";
import { getPublicPageRobots } from "~/lib/metadata";

export const metadata: Metadata = {
  title: "Book a Demo | See OdisAI in Action",
  description:
    "Schedule a personalized demo of OdisAI's veterinary AI voice agents. See how we handle calls, book appointments, and integrate with IDEXX Neo live.",
  keywords: [
    "veterinary AI demo",
    "OdisAI demo",
    "vet phone system demo",
    "AI receptionist trial",
    "IDEXX Neo demo",
    "veterinary software demo",
  ],
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Book a Demo | OdisAI for Veterinary Clinics",
    description:
      "Experience OdisAI's AI voice agents in a live demo tailored to your veterinary practice.",
    url: "/demo",
  },
  robots: getPublicPageRobots(),
};

export default function DemoPage() {
  return <DemoContent />;
}
