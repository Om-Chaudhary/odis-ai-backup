import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { IntegrationDetailPage } from "./integration-detail-page";
import {
  getIntegrationBySlug,
  getAllIntegrationSlugs,
  type Integration,
} from "~/data/integrations";

interface IntegrationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate static params for all integrations
 */
export async function generateStaticParams() {
  const slugs = getAllIntegrationSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Generate metadata for the integration page
 */
export async function generateMetadata({
  params,
}: IntegrationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const integration = getIntegrationBySlug(slug);

  if (!integration) {
    return {
      title: "Integration Not Found | OdisAI",
    };
  }

  return {
    title: `${integration.name} Integration | OdisAI`,
    description:
      integration.description ||
      `Learn how OdisAI integrates with ${integration.name} to automate your veterinary practice communications.`,
  };
}

export default async function IntegrationPage({
  params,
}: IntegrationPageProps) {
  const { slug } = await params;
  const integration = getIntegrationBySlug(slug);

  if (!integration) {
    notFound();
  }

  // For coming soon integrations, show a different layout
  if (integration.status === "coming-soon") {
    return <ComingSoonIntegration integration={integration} />;
  }

  return <IntegrationDetailPage integration={integration} />;
}

/**
 * Coming Soon Integration Component
 */
function ComingSoonIntegration({ integration }: { integration: Integration }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <span className="mb-4 inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
          Coming Soon
        </span>
        <h1 className="font-display mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          {integration.name} Integration
        </h1>
        <p className="text-muted-foreground mb-8">
          {/* TODO: Add coming soon message */}
          We&apos;re working on bringing {integration.name} integration to
          OdisAI. Sign up to be notified when it&apos;s available.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="mailto:hello@odis.ai?subject=Notify me about ${integration.name} integration"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition-all"
          >
            Notify Me
          </a>
          <Link
            href="/integrations"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            View All Integrations
          </Link>
        </div>
      </div>
    </div>
  );
}
