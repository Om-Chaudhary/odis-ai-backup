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
