import type { Metadata } from "next";
import { env } from "~/env.js";
import Footer from "~/components/layout/footer";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Latest insights, tips, and updates from the Odis AI team on veterinary practice management, technology, and industry trends.",
  openGraph: {
    title: "Blog | Odis AI",
    description:
      "Latest insights, tips, and updates from the Odis AI team on veterinary practice management, technology, and industry trends.",
    url: `${env.NEXT_PUBLIC_SITE_URL}/blog`,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
      {/* Animated background elements matching landing page */}
      <div className="pointer-events-none absolute inset-0">
        {/* Animated gradient overlay */}
        <div
          className="blog-gradient-move absolute inset-0 opacity-30 blur-sm"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 40%, transparent 70%)",
          }}
        />

        {/* Secondary moving gradient */}
        <div
          className="blog-gradient-move-reverse absolute inset-0 opacity-25 blur-sm"
          style={{
            background:
              "radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 50%, transparent 80%)",
          }}
        />

        {/* Floating accent orbs */}
        <div
          className="blog-float-slow absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 60%)",
          }}
        />
        <div
          className="blog-float-slow-reverse absolute right-1/3 bottom-1/3 h-[200px] w-[200px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main content */}
      <main className="relative">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
