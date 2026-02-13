import type { Metadata } from "next";
import { FeaturesContent } from "./features-content";
import { getPublicPageRobots } from "~/lib/metadata";

export const metadata: Metadata = {
  title: "AI Voice Features for Veterinarians | 24/7 Call Handling",
  description:
    "Explore OdisAI's AI voice features: 24/7 call answering, appointment scheduling, IDEXX Neo integration, discharge call automation, and real-time analytics for veterinary clinics.",
  keywords: [
    "veterinary AI features",
    "24/7 vet phone answering",
    "IDEXX Neo integration",
    "veterinary appointment scheduling",
    "discharge call automation",
    "vet clinic call analytics",
    "AI voice features for vets",
    "veterinary practice automation",
  ],
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "AI Voice Features for Veterinarians | OdisAI",
    description:
      "Discover how OdisAI's AI voice agents transform veterinary practice communication with 24/7 availability, smart scheduling, and PIMS integration.",
    url: "/features",
  },
  robots: getPublicPageRobots(),
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
