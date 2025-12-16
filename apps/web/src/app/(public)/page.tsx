import {
  LandingNavbar,
  HeroSection,
  SampleCallsSection,
  CompareSection,
  HowItWorksSection,
  TestimonialsSection,
  IntegrationsSection,
  CTASection,
  FAQSection,
  LandingFooter,
  ScrollProgress,
  LandingAnalytics,
} from "~/components/landing";

export default function Page() {
  return (
    <>
      <LandingAnalytics />
      <ScrollProgress />
      <LandingNavbar />
      <HeroSection />
      <SampleCallsSection />
      <CompareSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <CTASection />
      <FAQSection />
      <LandingFooter />
    </>
  );
}
