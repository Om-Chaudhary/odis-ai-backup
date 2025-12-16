/**
 * Integration Data
 *
 * Centralized data for all OdisAI integrations.
 * Used by the integrations hub and detail pages.
 */

export type IntegrationStatus = "active" | "coming-soon" | "beta";

export interface Integration {
  /**
   * URL-friendly slug
   */
  slug: string;
  /**
   * Display name
   */
  name: string;
  /**
   * Short description (for cards)
   */
  shortDescription: string;
  /**
   * Full description (for detail page)
   */
  description: string;
  /**
   * Logo image path
   */
  logoSrc?: string;
  /**
   * Integration status
   */
  status: IntegrationStatus;
  /**
   * Key features/capabilities
   */
  features: string[];
  /**
   * How the integration works (steps)
   */
  howItWorks?: {
    title: string;
    description: string;
  }[];
  /**
   * Setup requirements
   */
  requirements?: string[];
  /**
   * Category/type of integration
   */
  category: "pims" | "communication" | "analytics" | "other";
}

// TODO: Fill in actual data for each integration
export const integrations: Integration[] = [
  // ============================================
  // Active Integrations
  // ============================================
  {
    slug: "idexx-neo",
    name: "IDEXX Neo",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/idexx-neo.png", // TODO: Add logo
    status: "active",
    category: "pims",
    features: [
      // TODO: Add features
      "Feature 1",
      "Feature 2",
      "Feature 3",
    ],
    howItWorks: [
      // TODO: Add steps
      {
        title: "Step 1",
        description: "",
      },
      {
        title: "Step 2",
        description: "",
      },
      {
        title: "Step 3",
        description: "",
      },
    ],
    requirements: [
      // TODO: Add requirements
      "Requirement 1",
      "Requirement 2",
    ],
  },
  {
    slug: "ezyvet",
    name: "ezyVet",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/ezyvet.png", // TODO: Add logo
    status: "active",
    category: "pims",
    features: [
      // TODO: Add features
      "Feature 1",
      "Feature 2",
      "Feature 3",
    ],
    howItWorks: [
      // TODO: Add steps
    ],
    requirements: [
      // TODO: Add requirements
    ],
  },
  {
    slug: "cornerstone",
    name: "Cornerstone",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/cornerstone.png", // TODO: Add logo
    status: "active",
    category: "pims",
    features: [
      // TODO: Add features
      "Feature 1",
      "Feature 2",
      "Feature 3",
    ],
    howItWorks: [
      // TODO: Add steps
    ],
    requirements: [
      // TODO: Add requirements
    ],
  },

  // ============================================
  // Coming Soon Integrations
  // ============================================
  {
    slug: "avimark",
    name: "AVImark",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/avimark.png", // TODO: Add logo
    status: "coming-soon",
    category: "pims",
    features: [
      // TODO: Add planned features
    ],
  },
  {
    slug: "covetrus-pulse",
    name: "Covetrus Pulse",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/covetrus-pulse.png", // TODO: Add logo
    status: "coming-soon",
    category: "pims",
    features: [
      // TODO: Add planned features
    ],
  },
  {
    slug: "hippo-manager",
    name: "Hippo Manager",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/hippo-manager.png", // TODO: Add logo
    status: "coming-soon",
    category: "pims",
    features: [
      // TODO: Add planned features
    ],
  },
  {
    slug: "shepherd",
    name: "Shepherd",
    shortDescription: "", // TODO: Add short description
    description: "", // TODO: Add full description
    logoSrc: "/images/integrations/shepherd.png", // TODO: Add logo
    status: "coming-soon",
    category: "pims",
    features: [
      // TODO: Add planned features
    ],
  },
];

/**
 * Get all integrations
 */
export function getAllIntegrations(): Integration[] {
  return integrations;
}

/**
 * Get active integrations
 */
export function getActiveIntegrations(): Integration[] {
  return integrations.filter((i) => i.status === "active");
}

/**
 * Get coming soon integrations
 */
export function getComingSoonIntegrations(): Integration[] {
  return integrations.filter((i) => i.status === "coming-soon");
}

/**
 * Get integration by slug
 */
export function getIntegrationBySlug(slug: string): Integration | undefined {
  return integrations.find((i) => i.slug === slug);
}

/**
 * Get all integration slugs (for static params)
 */
export function getAllIntegrationSlugs(): string[] {
  return integrations.map((i) => i.slug);
}
