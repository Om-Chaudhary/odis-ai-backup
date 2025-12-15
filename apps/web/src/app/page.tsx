import { PortfolioNavbar } from "~/components/PortfolioNavbar";
import { ProductTeaserCard } from "~/components/ProductTeaserCard";
import { CompareSection } from "~/components/CompareSection";
import { HowItWorks } from "~/components/HowItWorks";
import { UseCases } from "~/components/UseCases";
import { TestimonialsSection } from "~/components/TestimonialsSection";
import { SampleCallSection } from "~/components/SampleCallSection";
import { IntegrationCarousel } from "~/components/IntegrationCarousel";
import { PricingSection } from "~/components/PricingSection";
import { FAQSection } from "~/components/FAQSection";
import { Footer } from "~/components/Footer";

export default function Page() {
  return (
    <>
      <PortfolioNavbar />
      <ProductTeaserCard />
      <SampleCallSection />
      <CompareSection />
      <UseCases />
      <HowItWorks />
      <TestimonialsSection />
      <IntegrationCarousel />
      <PricingSection />
      <FAQSection />
      <Footer />
    </>
  );
}
