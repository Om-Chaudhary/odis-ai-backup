"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  IntegrationCard,
} from "~/components/marketing";
import {
  getActiveIntegrations,
  getComingSoonIntegrations,
} from "~/data/integrations";

export default function IntegrationsPage() {
  const activeRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);
  const isActiveInView = useInView(activeRef, { once: true, margin: "-100px" });
  const isComingSoonInView = useInView(comingSoonRef, {
    once: true,
    margin: "-100px",
  });

  const activeIntegrations = getActiveIntegrations();
  const comingSoonIntegrations = getComingSoonIntegrations();

  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero Section */}
      <PageHero
        badge="Integrations"
        title="Connect Your Practice Management System"
        subtitle="" // TODO: Add subtitle
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Integrations", href: "/integrations" },
        ]}
      />

      {/* Active Integrations */}
      <SectionContainer
        id="active-integrations"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Available Now"
          title="Active Integrations"
          subtitle="" // TODO: Add subtitle
        />

        <div
          ref={activeRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {activeIntegrations.map((integration, index) => (
            <IntegrationCard
              key={integration.slug}
              name={integration.name}
              slug={integration.slug}
              description={integration.shortDescription}
              logoSrc={integration.logoSrc}
              status={integration.status}
              features={integration.features}
              isInView={isActiveInView}
              delay={index * 0.1}
            />
          ))}
        </div>
      </SectionContainer>

      {/* Coming Soon Integrations */}
      {comingSoonIntegrations.length > 0 && (
        <SectionContainer
          id="coming-soon"
          backgroundVariant="warm-violet"
          padding="default"
        >
          <SectionHeader
            badge="Coming Soon"
            badgeVariant="violet"
            title="More Integrations on the Way"
            subtitle="" // TODO: Add subtitle
          />

          <div
            ref={comingSoonRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {comingSoonIntegrations.map((integration, index) => (
              <IntegrationCard
                key={integration.slug}
                name={integration.name}
                slug={integration.slug}
                description={integration.shortDescription}
                logoSrc={integration.logoSrc}
                status={integration.status}
                features={integration.features}
                isInView={isComingSoonInView}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Request Integration */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              {/* TODO: Add message */}
              Don&apos;t see your PIMS? Let us know!
            </p>
            <a
              href="mailto:hello@odis.ai?subject=Integration Request"
              className="font-semibold text-teal-600 transition-colors hover:text-teal-700"
            >
              Request an Integration
            </a>
          </div>
        </SectionContainer>
      )}

      {/* CTA Section */}
      <CTASection
        badge="Get Started"
        title="Ready to Connect Your Practice?"
        subtitle="" // TODO: Add subtitle
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />
    </MarketingLayout>
  );
}
