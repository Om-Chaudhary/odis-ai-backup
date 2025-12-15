/**
 * Landing Page Components
 *
 * All components for the main marketing landing page, exported with clear semantic naming.
 * Import from this barrel file for cleaner imports in page.tsx
 */

// Navigation
export { LandingNavbar } from "./navbar/LandingNavbar";

// Hero Section
export { HeroSection } from "./hero/HeroSection";

// Sample Calls / Audio Demo Section
export { AudioDemoSection as SampleCallsSection } from "./audio-demo";

// Compare Section (Before/After)
export { CompareSection } from "./compare/CompareSection";

// How It Works Section
export { HowItWorks as HowItWorksSection } from "./how-it-works/HowItWorks";

// Testimonials Section
export { TestimonialsSection } from "./testimonials/TestimonialsSection";

// Integrations Section
export { IntegrationCarousel as IntegrationsSection } from "./integrations/IntegrationCarousel";

// CTA / Pricing Section
export { PricingSection as CTASection } from "./pricing/PricingSection";

// FAQ Section
export { FAQSection } from "./faq/FAQSection";

// Footer
export { Footer as LandingFooter } from "./footer/Footer";

// Scroll Effects
export { ScrollProgress } from "./scroll-progress";
