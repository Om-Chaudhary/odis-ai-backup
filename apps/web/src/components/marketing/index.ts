/**
 * Marketing Components
 *
 * A comprehensive set of reusable components for building
 * marketing and public-facing pages with consistent styling,
 * animations, and structure.
 */

// =============================================================================
// Legacy Components (existing)
// =============================================================================

export * from "./faq";
export * from "./waitlist-modal";
export * from "./hero";

// =============================================================================
// Layouts
// =============================================================================

export {
  MarketingLayout,
  type MarketingLayoutProps,
  MarketingNavbar,
  type MarketingNavbarProps,
  type NavLink,
  type NavDropdown,
  type NavItem,
  type NavbarVariant,
  MarketingFooter,
  type MarketingFooterProps,
} from "./layouts";

// =============================================================================
// Sections
// =============================================================================

export {
  PageHero,
  type PageHeroProps,
  SectionContainer,
  type SectionContainerProps,
  SectionHeader,
  type SectionHeaderProps,
  CTASection,
  type CTASectionProps,
  SocialProofBar,
  type SocialProofBarProps,
  AccordionFAQ,
  type AccordionFAQProps,
  TestimonialCard,
  type TestimonialCardProps,
  CrossLinkSection,
  type CrossLinkItem,
  type CrossLinkSectionProps,
  HowItWorksSection,
  type HowItWorksStep,
  type HowItWorksSectionProps,
  BentoFeatureGrid,
  type BentoFeature,
  type BentoFeatureGridProps,
  VerdictSection,
  type VerdictSectionProps,
  KeyAdvantagesBar,
  type KeyAdvantage,
  type KeyAdvantagesBarProps,
  SwitchingGuideSection,
  type SwitchingGuideSectionProps,
  AnimatedMetricsSection,
  type MetricItem,
  type AnimatedMetricsSectionProps,
  ArticleTableOfContents,
  type TocItem,
  type ArticleTableOfContentsProps,
  ArticleRenderer,
  type ArticleSection,
  type ArticleRendererProps,
  type ComponentRegistry,
} from "./sections";

// =============================================================================
// UI Components
// =============================================================================

export { FeatureCard, type FeatureCardProps } from "./ui";

// =============================================================================
// Skeletons
// =============================================================================

export {
  MarketingPageSkeleton,
  type MarketingPageSkeletonProps,
} from "./skeletons";
