/**
 * Case Study Type Definitions
 * These types define the structure for case studies across the application
 */

export interface CaseStudyMetrics {
  label: string;
  value: string;
  description?: string;
}

export interface CaseStudyChallenge {
  title: string;
  description: string;
}

export interface CaseStudySolution {
  title: string;
  description: string;
  features?: string[];
}

export interface CaseStudyTestimonial {
  quote: string;
  author: string;
  role: string;
  image?: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  client: {
    name: string;
    logo?: string;
    industry: string;
    location: string;
    size?: string;
  };
  summary: string;
  image: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime?: string;

  // Detailed content
  overview: string;
  challenges: CaseStudyChallenge[];
  solutions: CaseStudySolution[];
  results: {
    overview: string;
    metrics: CaseStudyMetrics[];
  };
  testimonial?: CaseStudyTestimonial;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}
