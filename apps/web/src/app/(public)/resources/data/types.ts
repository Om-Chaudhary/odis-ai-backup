export interface ResourcePageData {
  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];

  // Hero section
  hero: {
    badge: string;
    title: string;
    subtitle: string;
  };

  // Structured educational content sections
  // content: HTML string rendered with prose styling
  // component: optional React component key for rich interactive sections
  sections: Array<{
    title: string;
    content: string; // rich text content (rendered as HTML with typography plugin)
    component?: string; // optional key to render a React component instead of/alongside HTML
    callout?: {
      type: "tip" | "warning" | "stat" | "comparison" | "insight";
      text: string;
    };
  }>;

  // Optional downloadable asset (template, checklist)
  asset?: {
    title: string;
    description: string;
    ctaText: string;
  };

  // Key statistics with sources
  stats?: Array<{
    value: string;
    label: string;
    source?: string;
  }>;

  // FAQ accordion
  faqs: Array<{
    question: string;
    answer: string;
  }>;

  // Contextual product mention (not hard-sell CTA)
  productTieIn: {
    title: string;
    description: string;
    solutionSlug?: string; // Optional - newer resources use features instead
    features?: string[];
    cta?: string;
  };

  // Cross-linking (accepts both string slugs and objects for backwards compatibility)
  relatedResources?: Array<
    | string
    | {
        slug: string;
        label: string;
      }
  >;
  relatedSolutions?: Array<
    | string
    | {
        slug: string;
        label: string;
      }
  >;

  // Schema.org type for JSON-LD
  schemaType?: "Article" | "HowTo" | "FAQPage";

  // Hub page fields
  iconName?: string;
  cardDescription?: string;
}
