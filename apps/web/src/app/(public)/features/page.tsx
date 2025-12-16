"use client";

import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  FeatureCard,
} from "~/components/marketing";
import {
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  Shield,
  Zap,
  Users,
  TrendingUp,
  HeartPulse,
} from "lucide-react";

// TODO: Replace with actual feature data
const coreFeatures = [
  {
    icon: Phone,
    title: "24/7 Call Handling",
    description: "", // TODO: Add description
    highlights: [], // TODO: Add highlights
  },
  {
    icon: Calendar,
    title: "Appointment Scheduling",
    description: "", // TODO: Add description
    highlights: [], // TODO: Add highlights
  },
  {
    icon: MessageSquare,
    title: "Discharge Follow-ups",
    description: "", // TODO: Add description
    highlights: [], // TODO: Add highlights
  },
  {
    icon: Clock,
    title: "After-Hours Support",
    description: "", // TODO: Add description
    highlights: [], // TODO: Add highlights
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "", // TODO: Add description
    highlights: [], // TODO: Add highlights
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "", // TODO: Add description
    highlights: [], // TODO: Add highlights
  },
];

// TODO: Replace with actual benefits data
const benefits = [
  {
    icon: TrendingUp,
    title: "Increase Revenue",
    description: "", // TODO: Add description
  },
  {
    icon: Users,
    title: "Better Client Experience",
    description: "", // TODO: Add description
  },
  {
    icon: HeartPulse,
    title: "Focus on Patient Care",
    description: "", // TODO: Add description
  },
];

export default function FeaturesPage() {
  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero Section */}
      <PageHero
        badge="Features"
        title="Everything You Need to Transform Your Practice"
        subtitle="" // TODO: Add subtitle
        backgroundVariant="hero-glow"
      />

      {/* Core Features Section */}
      <SectionContainer
        id="core-features"
        backgroundVariant="cool-blue"
        padding="large"
      >
        <SectionHeader
          badge="Core Features"
          title="Powerful AI Voice Technology"
          subtitle="" // TODO: Add subtitle
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              highlights={feature.highlights}
              delay={index * 0.1}
            />
          ))}
        </div>
      </SectionContainer>

      {/* Benefits Section */}
      <SectionContainer
        id="benefits"
        backgroundVariant="warm-violet"
        padding="large"
      >
        <SectionHeader
          badge="Benefits"
          badgeVariant="violet"
          title="Why Veterinary Clinics Choose OdisAI"
          subtitle="" // TODO: Add subtitle
        />

        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <FeatureCard
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              delay={index * 0.1}
              className="text-center"
            />
          ))}
        </div>
      </SectionContainer>

      {/* CTA Section */}
      <CTASection
        badge="Get Started"
        title="Ready to See These Features in Action?"
        subtitle="" // TODO: Add subtitle
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />
    </MarketingLayout>
  );
}
