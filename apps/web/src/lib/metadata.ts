import { env } from "~/env.js";

/**
 * Environment-aware robots metadata
 * Only allows indexing in production environment
 */
export function getEnvironmentRobots() {
  const isProduction = env.NEXT_PUBLIC_APP_ENV === "production";

  return {
    index: isProduction,
    follow: isProduction,
    googleBot: {
      index: isProduction,
      follow: isProduction,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  };
}

export function getPublicPageRobots() {
  return getEnvironmentRobots();
}
