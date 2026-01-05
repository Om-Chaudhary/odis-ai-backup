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

const coreFeatures = [
  {
    icon: Phone,
    title: "24/7 Call Handling",
    description:
      "Never miss a call again. Our AI voice agent answers every call with natural conversation, handling inquiries, providing updates, and routing urgent matters—day or night.",
    highlights: [
      "Natural, human-like conversations",
      "Instant call answering with zero hold time",
      "Smart routing for emergencies",
      "Multi-language support",
    ],
  },
  {
    icon: Calendar,
    title: "Appointment Scheduling",
    description:
      "Let pet parents book, reschedule, or cancel appointments during calls. Real-time calendar sync ensures accurate availability and eliminates double-bookings.",
    highlights: [
      "Real-time calendar integration",
      "Automated confirmation & reminders",
      "Reschedule and cancellation handling",
      "Reduce no-shows by 40%",
    ],
  },
  {
    icon: MessageSquare,
    title: "Discharge Follow-ups",
    description:
      "Automate post-visit calls with intelligent batch scheduling. Check on patient recovery, answer questions, and ensure medication compliance—all without staff involvement.",
    highlights: [
      "Batch scheduling for efficiency",
      "Intelligent retry logic",
      "Sentiment analysis & flagging",
      "Detailed call outcome reports",
    ],
  },
  {
    icon: Clock,
    title: "After-Hours Support",
    description:
      "Provide round-the-clock coverage without hiring night staff. Triage emergencies, answer common questions, and give pet parents peace of mind any time they call.",
    highlights: [
      "True 24/7/365 availability",
      "Emergency triage protocols",
      "On-call veterinarian routing",
      "Holiday and weekend coverage",
    ],
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description:
      "Enterprise-grade security protects every conversation. HIPAA compliant infrastructure with end-to-end encryption ensures patient data stays confidential and secure.",
    highlights: [
      "HIPAA compliant infrastructure",
      "End-to-end encryption",
      "SOC 2 Type II certified",
      "Regular security audits",
    ],
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Go live in under 24 hours. Our team handles the entire setup process, from PIMS integration to voice customization, so you can start capturing calls immediately.",
    highlights: [
      "Live in under 24 hours",
      "White-glove onboarding",
      "PIMS integration included",
      "Custom voice & personality",
    ],
  },
];

const benefits = [
  {
    icon: TrendingUp,
    title: "Increase Revenue",
    description:
      "Capture every missed call and convert more inquiries into appointments. Clinics using OdisAI see an average 23% increase in booked appointments and recover thousands in previously lost revenue each month.",
  },
  {
    icon: Users,
    title: "Better Client Experience",
    description:
      "Pet parents get immediate answers, personalized service, and convenient scheduling—no hold times, no phone tag. 94% of clients report higher satisfaction after switching to OdisAI.",
  },
  {
    icon: HeartPulse,
    title: "Focus on Patient Care",
    description:
      "Free your team from constant phone interruptions. Veterinarians and technicians spend more time with patients while OdisAI handles scheduling, follow-ups, and routine inquiries.",
  },
];

export function FeaturesContent() {
  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero Section */}
      <PageHero
        badge="Features"
        title="Everything You Need to Transform Your Practice"
        subtitle="A complete AI-powered phone system that handles calls, schedules appointments, and follows up with patients—so your team can focus on what matters most: exceptional patient care."
        backgroundVariant="hero-glow"
      />

      {/* Core Features Section */}
      <SectionContainer
        id="core-features"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Core Features"
          title="Powerful AI Voice Technology"
          subtitle="From handling incoming calls to automated discharge follow-ups, every feature is designed to save your team hours each day while improving patient outcomes."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        padding="default"
      >
        <SectionHeader
          badge="Benefits"
          badgeVariant="violet"
          title="Why Veterinary Clinics Choose OdisAI"
          subtitle="Join hundreds of practices already transforming how they connect with pet parents and deliver care."
        />

        <div className="mt-12 grid gap-8 md:grid-cols-3">
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
        subtitle="Book a personalized demo and discover how OdisAI can transform your practice. Our team will walk you through every feature and answer all your questions. Setup takes less than 24 hours."
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />
    </MarketingLayout>
  );
}
