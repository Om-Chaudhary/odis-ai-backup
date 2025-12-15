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
} from "~/components/landing";

export default function Page() {
  return (
    <>
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
