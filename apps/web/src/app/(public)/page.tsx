import dynamic from "next/dynamic";
import {
  LandingNavbar,
  HeroSection,
  ScrollProgress,
  LandingAnalytics,
} from "~/components/landing";

// Below-fold sections: dynamic import to reduce initial JS bundle
const ProblemSection = dynamic(
  () =>
    import("~/components/landing/sections/problem-section").then((mod) => ({
      default: mod.ProblemSection,
    })),
  {
    loading: () => <div className="min-h-[600px]" />,
  },
);

const SampleCallsSection = dynamic(
  () =>
    import("~/components/landing/sections/audio-demo-section").then((mod) => ({
      default: mod.AudioDemoSection,
    })),
  {
    loading: () => <div className="min-h-[500px]" />,
  },
);

const FeaturesSection = dynamic(
  () =>
    import("~/components/landing/sections/features-section").then((mod) => ({
      default: mod.FeaturesSection,
    })),
  {
    loading: () => <div className="min-h-[800px]" />,
  },
);

const HowItWorksSection = dynamic(
  () =>
    import("~/components/landing/sections/how-it-works-section").then(
      (mod) => ({
        default: mod.HowItWorksSection,
      }),
    ),
  {
    loading: () => <div className="min-h-[700px]" />,
  },
);

const TestimonialsSection = dynamic(
  () =>
    import("~/components/landing/sections/testimonials-section").then(
      (mod) => ({
        default: mod.TestimonialsSection,
      }),
    ),
  {
    loading: () => <div className="min-h-[500px]" />,
  },
);

const IntegrationsSection = dynamic(
  () =>
    import("~/components/landing/sections/integrations-section").then(
      (mod) => ({
        default: mod.IntegrationsSection,
      }),
    ),
  {
    loading: () => <div className="min-h-[400px]" />,
  },
);

const CTASection = dynamic(
  () =>
    import("~/components/landing/sections/pricing-section").then((mod) => ({
      default: mod.PricingSection,
    })),
  {
    loading: () => <div className="min-h-[400px]" />,
  },
);

const FAQSection = dynamic(
  () =>
    import("~/components/landing/sections/faq-section").then((mod) => ({
      default: mod.FAQSection,
    })),
  {
    loading: () => <div className="min-h-[600px]" />,
  },
);

const LandingFooter = dynamic(
  () =>
    import("~/components/landing/sections/footer-section").then((mod) => ({
      default: mod.FooterSection,
    })),
  {
    loading: () => <div className="min-h-[300px]" />,
  },
);

const StickyMobileCTA = dynamic(() =>
  import("~/components/landing/shared/sticky-mobile-cta").then((mod) => ({
    default: mod.StickyMobileCTA,
  })),
);

export default function Page() {
  return (
    <>
      <LandingAnalytics />
      <ScrollProgress />
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <SampleCallsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <CTASection />
      <FAQSection />
      <LandingFooter />
      <StickyMobileCTA />
    </>
  );
}
