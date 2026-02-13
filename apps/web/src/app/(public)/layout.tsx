import type { Metadata } from "next";
import { getPublicPageRobots } from "~/lib/metadata";

export const metadata: Metadata = {
  robots: getPublicPageRobots(),
};

/**
 * Public Layout
 *
 * Layout for public marketing pages that don't require authentication.
 * Each page handles its own Navigation and Footer since they may vary.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
