import {
  LandingNavbar,
  HeroSection,
  ProblemSection,
  SampleCallsSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  IntegrationsSection,
  CTASection,
  FAQSection,
  LandingFooter,
  ScrollProgress,
  LandingAnalytics,
  StickyMobileCTA,
} from "~/components/landing";

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
