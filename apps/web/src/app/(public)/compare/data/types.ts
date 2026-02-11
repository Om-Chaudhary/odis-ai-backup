// Shared types for comparison pages
export interface ComparisonRow {
  feature: string;
  odis: boolean | string;
  competitor: boolean | string;
}

export interface DetailedSection {
  title: string;
  odis: string;
  competitor: string;
}

export interface ComparisonPageData {
  competitorName: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  hero: {
    badge: string;
    headline: string;
    title: string;
    subtitle: string;
  };
  comparisonTable: ComparisonRow[];
  detailedSections: DetailedSection[];
  differentiators: Array<{
    title: string;
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

  // Hub & categorization
  cardDescription: string;
  competitorType: "vet-specific" | "general-receptionist" | "general-ai";

  // Key advantage stats
  keyAdvantages: Array<{ value: string; label: string }>;

  // Verdict / recommendation
  verdict: {
    summary: string;
    bestForOdis: string[];
    bestForCompetitor: string[];
  };

  // Social proof
  socialProof: {
    quote: string;
    attribution: string;
    proofLine: string;
  };

  // Switching guide
  switchingGuide: {
    title: string;
    description: string;
    steps: string[];
    timeline: string;
  };

  // Cross-linking
  relatedSolutions: Array<{ slug: string; label: string }>;
  relatedComparisons: Array<{ slug: string; label: string }>;
}
