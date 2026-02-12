import type { MetadataRoute } from "next";
import { env } from "~/env.js";
import { solutionSlugs } from "./(public)/solutions/data";
import { comparisonSlugs } from "./(public)/compare/data";
import { resourceSlugs } from "./(public)/resources/data";

// Integration slugs for programmatic SEO pages
const integrationSlugs = [
  "idexx-neo",
  "ezyvet",
  "cornerstone",
  "avimark",
  "covetrus-pulse",
  "shepherd",
  "vetspire",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const currentDate = new Date();

  // Generate integration page entries
  const integrationPages: MetadataRoute.Sitemap = integrationSlugs.map(
    (slug) => ({
      url: `${baseUrl}/integrations/${slug}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
  );

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1,
    },

    // Marketing pages
    {
      url: `${baseUrl}/features`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },

    // Integrations hub and detail pages
    {
      url: `${baseUrl}/integrations`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...integrationPages,

    // Solutions hub and detail pages
    {
      url: `${baseUrl}/solutions`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...solutionSlugs.map((slug) => ({
      url: `${baseUrl}/solutions/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // Comparison hub and detail pages
    {
      url: `${baseUrl}/compare`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    ...comparisonSlugs.map((slug) => ({
      url: `${baseUrl}/compare/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),

    // Resources hub and detail pages
    {
      url: `${baseUrl}/resources`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    ...resourceSlugs.map((slug) => ({
      url: `${baseUrl}/resources/${slug}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Support pages
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },

    // Auth pages
    {
      url: `${baseUrl}/sign-in`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.8,
    },

    // Legal pages
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
