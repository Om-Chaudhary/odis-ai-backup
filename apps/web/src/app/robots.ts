import type { MetadataRoute } from "next";
import { env } from "~/env.js";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const isProduction = env.NEXT_PUBLIC_APP_ENV === "production";

  // Block all crawling in dev/staging
  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  // Production: allow public pages, block authenticated areas
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/api/",
        "/auth/",
        "/_next/",
        "/sign-in",
        "/sign-up",
        // Note: /login removed - route doesn't exist, redirect handles it
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
