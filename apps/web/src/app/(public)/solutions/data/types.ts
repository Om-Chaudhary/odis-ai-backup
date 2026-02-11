// Shared types for solution pages
export interface SolutionPageData {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    socialProofLine?: string;
  };
  problem: {
    title: string;
    description: string;
    painPoints: string[];
  };
  solution: {
    title: string;
    description: string;
  };
  features: Array<{
    title: string;
    description: string;
    highlights: string[];
  }>;
  benefits: string[];
  metrics: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  cta: {
    title: string;
    subtitle: string;
    urgencyLine?: string;
    badge?: string;
  };

  // Hub card & hero enhancements
  iconName: string;
  cardDescription: string;
  heroStat?: { value: string; label: string };

  // Social proof
  socialProof: {
    quote: string;
    attribution: string;
    proofLine: string;
  };

  // How it works
  howItWorks: Array<{
    step: number;
    title: string;
    description: string;
    iconName: string;
  }>;

  // Migration support (optional)
  migrationSupport?: {
    title: string;
    description: string;
    steps: string[];
  };

  // Cross-linking
  relatedSolutions: Array<{
    slug: string;
    label: string;
    description: string;
  }>;
  relatedComparisons: Array<{ slug: string; label: string }>;
}
