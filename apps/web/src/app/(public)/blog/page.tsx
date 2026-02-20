import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "~/components/marketing";
import { blogPosts } from "./data";
import type { BlogPost } from "./data";
import { BlogCategorySection } from "./blog-category-section";
import { getPublicPageRobots } from "~/lib/metadata";

export const metadata: Metadata = {
  title: "Blog | OdisAI Insights",
  description:
    "Insights on AI technology, veterinary practice management, and the future of client communication from the OdisAI team.",
  alternates: {
    canonical: "/blog",
  },
  robots: getPublicPageRobots(),
};

const blogNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Blog", href: "/blog" },
];

const categoryOrder = [
  "AI in Veterinary Medicine",
  "Practice Revenue & Operations",
  "Client Communication & Experience",
  "Industry Trends & Future",
  "Practice Growth & Marketing",
  "Technology Implementation",
  "Forefront Perspectives",
];

const categoryStyles: Record<
  string,
  { bg: string; text: string; border: string; iconBg: string }
> = {
  "AI in Veterinary Medicine": {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-100 hover:border-teal-200",
    iconBg: "bg-teal-100",
  },
  "Practice Revenue & Operations": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100 hover:border-amber-200",
    iconBg: "bg-amber-100",
  },
  "Client Communication & Experience": {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-100 hover:border-indigo-200",
    iconBg: "bg-indigo-100",
  },
  "Industry Trends & Future": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-100 hover:border-violet-200",
    iconBg: "bg-violet-100",
  },
  "Practice Growth & Marketing": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100 hover:border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  "Technology Implementation": {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-100 hover:border-cyan-200",
    iconBg: "bg-cyan-100",
  },
  "Forefront Perspectives": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-100 hover:border-rose-200",
    iconBg: "bg-rose-100",
  },
};

const defaultStyle = {
  bg: "bg-slate-50",
  text: "text-slate-600",
  border: "border-slate-200 hover:border-slate-300",
  iconBg: "bg-slate-100",
};

function groupByCategory(
  posts: BlogPost[],
): { category: string; posts: BlogPost[] }[] {
  const grouped = new Map<string, BlogPost[]>();

  for (const post of posts) {
    const existing = grouped.get(post.category);
    if (existing) {
      existing.push(post);
    } else {
      grouped.set(post.category, [post]);
    }
  }

  // Sort by defined category order
  return categoryOrder
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({ category: cat, posts: grouped.get(cat)! }));
}

export default function BlogPage() {
  const posts = Object.values(blogPosts);
  const sections = groupByCategory(posts);

  return (
    <MarketingLayout
      navbar={{ variant: "solid", navigation: blogNavigation }}
      showScrollProgress
    >
      {/* Hero */}
      <header className="border-b border-slate-200 bg-white pt-32 pb-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase">
            Blog
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            OdisAI Insights
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-500">
            Practical insights on AI, veterinary practice management, and the
            future of client communication.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {posts.length} articles across {sections.length} categories
          </p>
        </div>
      </header>

      {/* Category Sections */}
      <section className="bg-white py-8">
        <div className="mx-auto max-w-5xl">
          {sections.map((section, index) => (
            <BlogCategorySection
              key={section.category}
              category={section.category}
              posts={section.posts}
              colors={categoryStyles[section.category] ?? defaultStyle}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            See how OdisAI works for your practice
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-100/70">
            Most clinics go live within 48 hours. Book a quick demo to see it in
            action.
          </p>
          <div className="mt-8">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
