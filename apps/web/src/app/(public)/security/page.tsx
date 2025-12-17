"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Shield,
  Lock,
  Server,
  FileCheck,
  Eye,
  Key,
  CheckCircle,
  Building,
} from "lucide-react";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  FeatureCard,
} from "~/components/marketing";

// TODO: Update security features with actual information
const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "", // TODO: Add description
    highlights: [
      // TODO: Add highlights
      "AES-256 encryption",
      "TLS 1.3 in transit",
      "Encrypted at rest",
    ],
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "", // TODO: Add description
    highlights: [
      // TODO: Add highlights
      "SOC 2 compliant hosting",
      "Regular security audits",
      "99.9% uptime SLA",
    ],
  },
  {
    icon: Key,
    title: "Access Controls",
    description: "", // TODO: Add description
    highlights: [
      // TODO: Add highlights
      "Role-based permissions",
      "Multi-factor authentication",
      "Session management",
    ],
  },
  {
    icon: Eye,
    title: "Privacy by Design",
    description: "", // TODO: Add description
    highlights: [
      // TODO: Add highlights
      "Data minimization",
      "Purpose limitation",
      "Transparent practices",
    ],
  },
  {
    icon: FileCheck,
    title: "Regular Audits",
    description: "", // TODO: Add description
    highlights: [
      // TODO: Add highlights
      "Penetration testing",
      "Vulnerability scanning",
      "Third-party audits",
    ],
  },
  {
    icon: Building,
    title: "Business Continuity",
    description: "", // TODO: Add description
    highlights: [
      // TODO: Add highlights
      "Disaster recovery",
      "Automated backups",
      "Geographic redundancy",
    ],
  },
];

// TODO: Update compliance certifications
const complianceBadges = [
  {
    name: "HIPAA",
    description: "", // TODO: Add description
    icon: Shield,
  },
  {
    name: "SOC 2",
    description: "", // TODO: Add description
    icon: CheckCircle,
  },
  // TODO: Add more compliance badges as needed
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SecurityPage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const complianceRef = useRef<HTMLDivElement>(null);

  const isFeaturesInView = useInView(featuresRef, {
    once: true,
    margin: "-100px",
  });
  const isComplianceInView = useInView(complianceRef, {
    once: true,
    margin: "-100px",
  });

  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero Section */}
      <PageHero
        badge="Security"
        title="Enterprise-Grade Security for Your Practice"
        subtitle="" // TODO: Add subtitle
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Security", href: "/security" },
        ]}
      />

      {/* Security Features */}
      <SectionContainer
        id="security-features"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Security Features"
          title="How We Protect Your Data"
          subtitle="" // TODO: Add subtitle
        />

        <div
          ref={featuresRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {securityFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              highlights={feature.highlights}
              isInView={isFeaturesInView}
              delay={index * 0.1}
            />
          ))}
        </div>
      </SectionContainer>

      {/* Compliance Section */}
      <SectionContainer
        id="compliance"
        backgroundVariant="warm-violet"
        padding="default"
      >
        <SectionHeader
          badge="Compliance"
          badgeVariant="violet"
          title="Industry Certifications & Compliance"
          subtitle="" // TODO: Add subtitle
        />

        <div ref={complianceRef} className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {complianceBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.name}
                  initial="hidden"
                  animate={isComplianceInView ? "visible" : "hidden"}
                  variants={fadeUpVariant}
                  transition={{ ...transition, delay: index * 0.1 }}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">
                      {badge.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {badge.description || "Description coming soon"}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Additional compliance info */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-muted-foreground">
              {/* TODO: Add additional compliance information */}
              For detailed information about our security practices and
              compliance certifications, please contact our security team.
            </p>
            <a
              href="mailto:security@odis.ai"
              className="mt-4 inline-block font-semibold text-teal-600 transition-colors hover:text-teal-700"
            >
              Contact Security Team
            </a>
          </div>
        </div>
      </SectionContainer>

      {/* Data Handling Section */}
      <SectionContainer
        id="data-handling"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="Data Handling"
          title="Your Data, Your Control"
          subtitle="" // TODO: Add subtitle
        />

        <div className="mx-auto max-w-3xl space-y-6">
          {/* TODO: Add data handling policies */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">
              Data Retention
            </h3>
            <p className="text-muted-foreground text-sm">
              {/* TODO: Add data retention policy */}
              Information about data retention coming soon.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Data Deletion</h3>
            <p className="text-muted-foreground text-sm">
              {/* TODO: Add data deletion policy */}
              Information about data deletion coming soon.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Data Export</h3>
            <p className="text-muted-foreground text-sm">
              {/* TODO: Add data export policy */}
              Information about data export coming soon.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* CTA Section */}
      <CTASection
        badge="Questions?"
        title="Have Security Questions?"
        subtitle="" // TODO: Add subtitle
        primaryCTAText="Contact Security Team"
        primaryCTAHref="mailto:security@odis.ai"
        secondaryCTAText="View Privacy Policy"
        secondaryCTAHref="/privacy-policy"
        showPhoneCTA={false}
      />
    </MarketingLayout>
  );
}
