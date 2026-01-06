import {
  MarketingLayout,
  PageHero,
  SectionContainer,
} from "~/components/marketing";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | OdisAI Insights",
  description:
    "Insights on AI technology and veterinary practice management from the OdisAI team.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return (
    <MarketingLayout navbar={{ variant: "transparent" }}>
      <PageHero
        badge="Blog"
        title="OdisAI Insights"
        subtitle="Exploring the future of veterinary practice management with AI."
        backgroundVariant="hero-glow"
      />
      <SectionContainer backgroundVariant="cool-blue" padding="default">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Coming Soon</h2>
          <p className="mt-4 text-slate-600">
            We're working on bringing you the latest insights and updates. Check
            back soon!
          </p>
        </div>
      </SectionContainer>
    </MarketingLayout>
  );
}
