import type { ResourcePageData } from "./data";

// ─────────────────────────────────────────────────────────────
// Resource categorization engine
//
// Two orderings matter:
//   1. matchPriority  — which category "claims" a resource first
//      (Comparisons wins over Costs, etc.)
//   2. displayOrder   — how sections render on the page
//      (Phone Systems first for revenue-impact hierarchy)
//
// Each resource is assigned to exactly ONE category.
// ─────────────────────────────────────────────────────────────

export interface ResourceCategory {
  id: string;
  label: string;
  heading: string;
  intro: string;
  keywords: string[];
  /** Related solution page slug for cross-linking */
  relatedSolution?: string;
}

export interface CategorizedResource {
  slug: string;
  data: ResourcePageData;
  category: string;
}

export interface ResourceSection {
  category: ResourceCategory;
  resources: CategorizedResource[];
}

// ── Category definitions ─────────────────────────────────────
// Ordered by MATCHING PRIORITY (first match wins for ambiguous resources)

const categoriesByMatchPriority: ResourceCategory[] = [
  {
    id: "comparisons",
    label: "Comparisons",
    heading: "Comparisons & Alternatives",
    intro:
      "Choosing the right answering solution depends on cost, coverage model, and workflow integration. These resources compare major vendors and service models.",
    keywords: ["vs", "comparison", "best", "alternative", "competitor"],
    relatedSolution: "veterinary-answering-service",
  },
  {
    id: "costs",
    label: "Costs & ROI",
    heading: "Costs & Revenue Impact",
    intro:
      "Missed calls and slow callbacks directly impact revenue and client retention. These guides break down cost structures, lost revenue calculations, and ROI models.",
    keywords: [
      "cost",
      "pricing",
      "missed calls",
      "revenue",
      "roi",
      "answering service cost",
    ],
    relatedSolution: "veterinary-answering-service",
  },
  {
    id: "after-hours",
    label: "After Hours",
    heading: "After-Hours & Emergency Triage",
    intro:
      "After-hours coverage and emergency triage are high-risk areas for veterinary clinics. These resources explore coverage models, liability risks, and best practices.",
    keywords: ["after hours", "emergency", "triage", "urgent", "on-call"],
    relatedSolution: "after-hours-veterinary",
  },
  {
    id: "phone-systems",
    label: "Phone Systems",
    heading: "Phone Systems & Answering Services",
    intro:
      "Phone overwhelm is one of the largest hidden operational problems in veterinary practices. These guides explore answering services, reception models, and phone workflow design.",
    keywords: [
      "answering",
      "receptionist",
      "call center",
      "phone system",
      "virtual receptionist",
      "inbound",
      "communication",
    ],
    relatedSolution: "veterinary-answering-service",
  },
  {
    id: "discharge",
    label: "Discharge & Follow-Up",
    heading: "Discharge & Follow-Up",
    intro:
      "Client compliance and post-visit communication directly impact patient outcomes and retention. These resources cover discharge standards, templates, and follow-up strategies.",
    keywords: [
      "discharge",
      "follow up",
      "follow-up",
      "compliance",
      "template",
      "post surgery",
      "aaha",
    ],
    relatedSolution: "discharge-follow-up",
  },
  {
    id: "automation",
    label: "Automation",
    heading: "Automation & AI",
    intro:
      "AI and automation are changing how veterinary practices manage communication workflows. These guides explain implementation models and integration strategies.",
    keywords: [
      "automation",
      "ai",
      "artificial intelligence",
      "integration",
      "pims",
      "workflow",
    ],
  },
];

// ── Display order ────────────────────────────────────────────
// Revenue-impact hierarchy: operations first, comparisons last

const displayOrder = [
  "phone-systems",
  "after-hours",
  "costs",
  "discharge",
  "automation",
  "comparisons",
];

/** All categories in display order (for filter pills, etc.) */
export const categories: ResourceCategory[] = displayOrder
  .map((id) => categoriesByMatchPriority.find((c) => c.id === id)!)
  .filter(Boolean);

// ── Categorization logic ────────────────────────────────────

function buildSearchText(slug: string, data: ResourcePageData): string {
  return [slug, data.hero.title, data.hero.badge, data.cardDescription]
    .join(" ")
    .toLowerCase();
}

// ── Pinned articles ──────────────────────────────────────────
// These articles are always featured first in their respective sections
const pinnedArticles: Record<string, string> = {
  "phone-systems": "vet-call-center-solutions",
  "after-hours": "emergency-vet-call-center",
  automation: "ai-veterinary-receptionist-guide",
};

/**
 * Categorize all resources into sections.
 * Each resource appears in exactly one section (match priority determines ownership).
 * Sections are returned in display order, empty sections omitted.
 * Pinned articles are always placed first in their category.
 */
export function categorizeResources(
  resources: Record<string, ResourcePageData>,
): ResourceSection[] {
  const assigned = new Set<string>();
  const sectionMap = new Map<string, CategorizedResource[]>();

  for (const cat of categoriesByMatchPriority) {
    sectionMap.set(cat.id, []);
  }

  // Assign resources by match priority
  for (const cat of categoriesByMatchPriority) {
    for (const [slug, data] of Object.entries(resources)) {
      if (assigned.has(slug)) continue;

      const searchText = buildSearchText(slug, data);
      const matches = cat.keywords.some((kw) => searchText.includes(kw));

      if (matches) {
        sectionMap.get(cat.id)!.push({ slug, data, category: cat.id });
        assigned.add(slug);
      }
    }
  }

  // Catch-all: unmatched → last display category
  const fallbackId = displayOrder[displayOrder.length - 1];
  for (const [slug, data] of Object.entries(resources)) {
    if (!assigned.has(slug) && fallbackId) {
      sectionMap.get(fallbackId)!.push({ slug, data, category: fallbackId });
    }
  }

  // Sort each section to ensure pinned articles are first
  for (const [categoryId, categoryResources] of sectionMap.entries()) {
    const pinnedSlug = pinnedArticles[categoryId];
    if (pinnedSlug) {
      categoryResources.sort((a, b) => {
        if (a.slug === pinnedSlug) return -1;
        if (b.slug === pinnedSlug) return 1;
        return 0;
      });
    }
  }

  // Return in display order, skip empty sections
  return categories
    .filter((cat) => (sectionMap.get(cat.id) ?? []).length > 0)
    .map((cat) => ({
      category: cat,
      resources: sectionMap.get(cat.id)!,
    }));
}

/** Map category IDs to readable labels for card tags */
export const categoryLabelMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.label]),
);
