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

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "Your sensitive data is protected with military-grade encryption at every stage, from storage to transmission.",
    highlights: [
      "AES-256 encryption for sensitive data",
      "TLS 1.3 for all data in transit",
      "Database encryption at rest via Supabase",
    ],
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description:
      "Built on enterprise-grade infrastructure from industry-leading providers with proven security track records.",
    highlights: [
      "SOC 2 Type II compliant hosting (Supabase)",
      "Enterprise-grade Vercel edge network",
      "Continuous security monitoring and updates",
    ],
  },
  {
    icon: Key,
    title: "Access Controls",
    description:
      "Granular permissions and authentication controls ensure only authorized users can access patient data.",
    highlights: [
      "Role-based access controls (RBAC)",
      "Secure session management",
      "Multi-factor authentication (coming soon)",
    ],
  },
  {
    icon: Eye,
    title: "Privacy by Design",
    description:
      "We collect only what's necessary and maintain transparent data practices aligned with healthcare standards.",
    highlights: [
      "Minimal data collection principles",
      "Clear data usage policies",
      "HIPAA-aligned security practices",
    ],
  },
  {
    icon: FileCheck,
    title: "Infrastructure Security",
    description:
      "Benefit from the rigorous security programs of our enterprise infrastructure providers.",
    highlights: [
      "Regular third-party security audits",
      "Automated vulnerability scanning",
      "Continuous security updates and patches",
    ],
  },
  {
    icon: Building,
    title: "Business Continuity",
    description:
      "Your practice data is protected with enterprise-grade backup and disaster recovery capabilities.",
    highlights: [
      "Automated daily backups",
      "Geographic redundancy across multiple regions",
      "Point-in-time recovery capabilities",
    ],
  },
];

const complianceBadges = [
  {
    name: "HIPAA-Aligned Practices",
    description:
      "We follow HIPAA-aligned security and privacy practices to protect patient health information, including encryption, access controls, and audit logging.",
    icon: Shield,
  },
  {
    name: "SOC 2 Type II Infrastructure",
    description:
      "Built on Supabase's SOC 2 Type II certified infrastructure, ensuring enterprise-grade security controls for data availability, processing integrity, and confidentiality.",
    icon: CheckCircle,
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SecurityContent() {
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
        subtitle="Built on SOC 2 compliant infrastructure with HIPAA-aligned practices. Your practice data is protected with the same enterprise security used by the world's leading healthcare organizations."
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
          subtitle="Multi-layered security controls protect your practice data at every step, from encryption and access controls to infrastructure monitoring and business continuity."
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
          subtitle="We maintain rigorous security and privacy standards aligned with healthcare industry requirements, built on certified enterprise infrastructure."
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
              Need a Business Associate Agreement (BAA) or detailed security
              documentation? Our team can provide comprehensive information
              about our security practices, infrastructure certifications, and
              compliance measures.
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
          subtitle="We believe your practice data belongs to you. Our transparent policies ensure you maintain full control over retention, deletion, and export of your information."
        />

        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">
              Data Retention
            </h3>
            <p className="text-muted-foreground text-sm">
              We retain your practice data in accordance with industry-standard
              veterinary record retention requirements (typically 7 years) and
              applicable legal obligations. Active data is immediately
              accessible through your dashboard, with archived records available
              upon request.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Data Deletion</h3>
            <p className="text-muted-foreground text-sm">
              You maintain control over your practice data. Upon account
              termination or deletion requests, we securely remove your data in
              accordance with our retention policies and legal requirements.
              Contact our security team for specific data deletion requests.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Data Export</h3>
            <p className="text-muted-foreground text-sm">
              Your data belongs to you. We provide mechanisms for exporting your
              practice data in standard formats. Contact our support team to
              discuss data export options and formats that work best for your
              needs.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* CTA Section */}
      <CTASection
        badge="Questions?"
        title="Have Security Questions?"
        subtitle="Our security team is here to answer your questions about compliance, data protection, and security practices. We're committed to transparency and protecting your practice data."
        primaryCTAText="Contact Security Team"
        primaryCTAHref="mailto:security@odis.ai"
        secondaryCTAText="View Privacy Policy"
        secondaryCTAHref="/privacy-policy"
        showPhoneCTA={false}
      />
    </MarketingLayout>
  );
}
