/**
 * Landing Page Components
 *
 * All components for the main marketing landing page, exported with clear semantic naming.
 * Import from this barrel file for cleaner imports in page.tsx
 */

// =============================================================================
// Sections
// =============================================================================

// Hero Section
export { HeroSection } from "./sections/hero-section";

// Problem Section (Pain Points)
export { ProblemSection } from "./sections/problem-section";

// Sample Calls / Audio Demo Section
export { AudioDemoSection as SampleCallsSection } from "./sections/audio-demo-section";

// Features Section (Bento Grid)
export { FeaturesSection } from "./sections/features-section";

// How It Works Section
export { HowItWorksSection } from "./sections/how-it-works-section";

// Testimonials Section
export { TestimonialsSection } from "./sections/testimonials-section";

// Integrations Section
export { IntegrationsSection } from "./sections/integrations-section";

// CTA / Pricing Section
export { PricingSection as CTASection } from "./sections/pricing-section";

// FAQ Section
export { FAQSection } from "./sections/faq-section";

// Footer
export { FooterSection as LandingFooter } from "./sections/footer-section";

// =============================================================================
// Shared Components
// =============================================================================

// Navigation
export { LandingNavbar } from "./shared/landing-navbar";

// Scroll Effects
export { ScrollProgress } from "./shared/scroll-progress";

// Sticky Mobile CTA
export { StickyMobileCTA } from "./shared/sticky-mobile-cta";

// Analytics
export {
  LandingAnalytics,
  trackBookDemoClick,
  trackDemoPhoneClick,
  trackScheduleDemoClick,
} from "./shared/landing-analytics";

// Audio Demo Card (used by AudioDemoSection)
export { AudioDemoCard } from "./shared/audio-demo-card";

// Cal.com Embed (used by Demo page)
export { CalEmbed } from "./shared/cal-embed";
export { CalEmbedWrapper } from "./shared/cal-embed-wrapper";

// =============================================================================
// UI Components (Landing-specific)
// =============================================================================

export { SectionBackground } from "./ui/section-background";
export { AnimatedGradientText } from "./ui/animated-gradient-text";
export { WordRotate } from "./ui/word-rotate";
export { PhoneRingIcon } from "./ui/phone-ring-icon";
export { ScrollIndicator } from "./ui/scroll-indicator";
export { Marquee } from "./ui/marquee";
export { AvatarCircles } from "./ui/avatar-circles";
export { NumberTicker } from "./ui/number-ticker";
export { NeonGradientCard } from "./ui/neon-gradient-card";
export { ShimmerButton } from "./ui/shimmer-button";
export { BlurFade } from "./ui/blur-fade";
