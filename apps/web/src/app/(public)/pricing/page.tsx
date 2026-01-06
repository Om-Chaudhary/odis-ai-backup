import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing | AI Voice Agents for Veterinary Clinics",
  description:
    "Transparent pricing for OdisAI's veterinary AI voice agents. Plans starting from $0 for small practices to enterprise solutions for multi-location clinics.",
  keywords: [
    "veterinary AI pricing",
    "vet phone system cost",
    "AI receptionist pricing",
    "veterinary answering service cost",
    "OdisAI pricing plans",
    "veterinary software pricing",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "OdisAI Pricing | AI Voice Agents for Vets",
    description:
      "See our transparent pricing plans for veterinary AI voice agents. Start free, scale as you grow.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
