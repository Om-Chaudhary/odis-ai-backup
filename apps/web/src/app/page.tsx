import {
  LandingNavbar,
  HeroSection,
  SampleCallsSection,
  CompareSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  IntegrationsSection,
  CTASection,
  FAQSection,
  LandingFooter,
} from "~/components/landing";

export default function Page() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <SampleCallsSection />
      <CompareSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <CTASection />
      <FAQSection />
      <LandingFooter />
    </>
  );
}
