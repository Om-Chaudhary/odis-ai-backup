import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
} from "~/components/marketing";
import { cn } from "@odis-ai/shared/util";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odisai.net";

export const metadata: Metadata = {
  title: "Integrations | Connect OdisAI with Your Practice Software",
  description:
    "OdisAI integrates seamlessly with leading veterinary practice management systems including IDEXX Neo, ezyVet, Cornerstone, and more. Sync calls, appointments, and patient data automatically.",
  keywords: [
    "veterinary software integrations",
    "IDEXX Neo integration",
    "ezyVet integration",
    "Cornerstone integration",
    "veterinary PIMS integration",
    "practice management system integration",
    "OdisAI integrations",
  ],
  alternates: {
    canonical: `${siteUrl}/integrations`,
  },
  openGraph: {
    title: "OdisAI Integrations | Connect with Your Vet Software",
    description:
      "Seamless integrations with IDEXX Neo, ezyVet, Cornerstone, and more veterinary practice management systems.",
    url: `${siteUrl}/integrations`,
  },
};

// Integration data - can be moved to a data file or CMS
const integrations = [
  {
    slug: "idexx-neo",
    name: "IDEXX Neo",
    logo: "/integrations/idexx-neo-logo.svg",
    description:
      "Deep integration with IDEXX Neo for real-time appointment scheduling, call logging, and patient data sync.",
    status: "live" as const,
    features: [
      "Real-time calendar sync",
      "Automatic call note logging",
      "Patient lookup during calls",
      "Appointment booking",
    ],
  },
  {
    slug: "ezyvet",
    name: "ezyVet",
    logo: "/integrations/ezyvet-logo.svg",
    description:
      "Connect OdisAI with ezyVet for seamless cloud-based practice management and AI-powered call automation.",
    status: "coming-soon" as const,
    features: [
      "Cloud-based calendar access",
      "Patient record integration",
      "Smart reminder integration",
      "Client communication hub",
    ],
  },
  {
    slug: "cornerstone",
    name: "Cornerstone",
    logo: "/integrations/cornerstone-logo.svg",
    description:
      "Integrate OdisAI with IDEXX Cornerstone to modernize phone operations while keeping your trusted PIMS.",
    status: "coming-soon" as const,
    features: [
      "Schedule synchronization",
      "Patient data access",
      "Call note integration",
      "Discharge follow-ups",
    ],
  },
  {
    slug: "avimark",
    name: "AVImark",
    logo: "/integrations/avimark-logo.svg",
    description:
      "Connect AVImark with OdisAI for automated phone handling that syncs with your practice workflow.",
    status: "coming-soon" as const,
    features: [
      "Appointment scheduling",
      "Patient information sync",
      "Call tracking & logging",
      "Reminder automation",
    ],
  },
  {
    slug: "covetrus-pulse",
    name: "Covetrus Pulse",
    logo: "/integrations/covetrus-pulse-logo.svg",
    description:
      "Connect OdisAI with Covetrus Pulse for cloud-native AI voice automation that scales with your practice.",
    status: "coming-soon" as const,
    features: [
      "Native cloud integration",
      "Smart scheduling",
      "Automated workflows",
      "Multi-location support",
    ],
  },
  {
    slug: "shepherd",
    name: "Shepherd",
    logo: "/integrations/shepherd-logo.svg",
    description:
      "Pair OdisAI with Shepherd for an AI-first veterinary practice experience from booking to discharge.",
    status: "coming-soon" as const,
    features: [
      "AI-to-AI integration",
      "Unified client experience",
      "Real-time sync",
      "Analytics integration",
    ],
  },
  {
    slug: "vetspire",
    name: "VetSpire",
    logo: "/integrations/vetspire-logo.svg",
    description:
      "Connect OdisAI with VetSpire for enterprise-grade AI voice automation across your veterinary network.",
    status: "coming-soon" as const,
    features: [
      "Multi-location management",
      "Enterprise scheduling",
      "Centralized reporting",
      "Custom protocols",
    ],
  },
];

function IntegrationCard({
  integration,
}: {
  integration: (typeof integrations)[0];
}) {
  const isLive = integration.status === "live";

  return (
    <Link
      href={isLive ? `/integrations/${integration.slug}` : "#"}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-300",
        isLive
          ? "border-slate-200 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/10"
          : "cursor-default border-slate-100 opacity-75",
      )}
    >
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            isLive ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500",
          )}
        >
          {isLive ? "Available" : "Coming Soon"}
        </span>
      </div>

      {/* Logo placeholder */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100">
        <span className="text-2xl font-bold text-slate-400">
          {integration.name.charAt(0)}
        </span>
      </div>

      {/* Content */}
      <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
        {integration.name}
      </h3>
      <p className="mb-4 text-sm text-slate-600">{integration.description}</p>

      {/* Features */}
      <ul className="mt-auto space-y-1.5">
        {integration.features.slice(0, 3).map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm text-slate-500"
          >
            <span className="h-1 w-1 rounded-full bg-teal-500" />
            {feature}
          </li>
        ))}
      </ul>

      {isLive && (
        <div className="mt-4 text-sm font-medium text-teal-600 group-hover:text-teal-700">
          Learn more →
        </div>
      )}
    </Link>
  );
}

export default function IntegrationsPage() {
  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      <PageHero
        badge="Integrations"
        title="Connect with Your Practice Software"
        subtitle="OdisAI integrates seamlessly with leading veterinary practice management systems for automated call handling, scheduling, and patient data sync."
        backgroundVariant="hero-glow"
      />

      <SectionContainer
        id="integrations-grid"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.slug} integration={integration} />
          ))}
        </div>

        {/* Request integration CTA */}
        <div className="mt-16 text-center">
          <p className="mb-4 text-slate-600">
            Don&apos;t see your practice management system?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Request an Integration
          </Link>
        </div>
      </SectionContainer>
    </MarketingLayout>
  );
}
