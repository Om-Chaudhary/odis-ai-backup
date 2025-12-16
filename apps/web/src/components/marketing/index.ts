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
} from "./sections";

// =============================================================================
// UI Components
// =============================================================================

export {
  FeatureCard,
  type FeatureCardProps,
  IntegrationCard,
  type IntegrationCardProps,
  type IntegrationStatus,
} from "./ui";

// =============================================================================
// Skeletons
// =============================================================================

export {
  MarketingPageSkeleton,
  type MarketingPageSkeletonProps,
} from "./skeletons";
