import type { ElementType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Moon,
  DollarSign,
  FileText,
  Cpu,
  GitCompare,
} from "lucide-react";
import { MarketingLayout } from "~/components/marketing";
import { resources } from "./data";
import {
  categorizeResources,
  categories,
  categoryLabelMap,
} from "./categorize-resources";
import { ResourcesHero } from "./resources-hero";
import { ResourceSection } from "./resource-section";

// ─────────────────────────────────────────────────────────────
// Shared content hub navigation
// ─────────────────────────────────────────────────────────────

const contentNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Compare", href: "/compare" },
];

// ─────────────────────────────────────────────────────────────
// SEO metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:
    "Veterinary Practice Operations Library | Free Guides & Templates | OdisAI",
  description:
    "Research, templates, and practical guides to help small animal clinics reduce phone overwhelm, recover revenue, and improve client compliance. Free veterinary practice resources.",
  keywords: [
    "veterinary practice resources",
    "veterinary discharge instructions",
    "aaha discharge instructions",
    "veterinary client communication",
    "veterinary answering service cost",
    "veterinary practice automation",
    "vet clinic resources",
    "veterinary phone systems",
    "after hours veterinary",
    "veterinary practice operations",
  ],
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Veterinary Practice Operations Library | OdisAI",
    description:
      "Research, templates, and practical guides to help small animal clinics reduce phone overwhelm, recover revenue, and improve client compliance.",
    url: "/resources",
  },
};

// ─────────────────────────────────────────────────────────────
// Category visual config — icon + color per section
// ─────────────────────────────────────────────────────────────

const categoryConfig: Record<
  string,
  {
    iconName: string;
    accentBorder: string;
    accentText: string;
    iconBg: string;
    tagBg: string;
    tagText: string;
  }
> = {
  "phone-systems": {
    iconName: "Phone",
    accentBorder: "border-l-teal-500",
    accentText: "text-teal-700",
    iconBg: "bg-teal-100",
    tagBg: "bg-teal-50",
    tagText: "text-teal-700",
  },
  "after-hours": {
    iconName: "Moon",
    accentBorder: "border-l-indigo-500",
    accentText: "text-indigo-700",
    iconBg: "bg-indigo-100",
    tagBg: "bg-indigo-50",
    tagText: "text-indigo-700",
  },
  costs: {
    iconName: "DollarSign",
    accentBorder: "border-l-amber-500",
    accentText: "text-amber-700",
    iconBg: "bg-amber-100",
    tagBg: "bg-amber-50",
    tagText: "text-amber-700",
  },
  discharge: {
    iconName: "FileText",
    accentBorder: "border-l-emerald-500",
    accentText: "text-emerald-700",
    iconBg: "bg-emerald-100",
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
  },
  automation: {
    iconName: "Cpu",
    accentBorder: "border-l-cyan-500",
    accentText: "text-cyan-700",
    iconBg: "bg-cyan-100",
    tagBg: "bg-cyan-50",
    tagText: "text-cyan-700",
  },
  comparisons: {
    iconName: "GitCompare",
    accentBorder: "border-l-violet-500",
    accentText: "text-violet-700",
    iconBg: "bg-violet-100",
    tagBg: "bg-violet-50",
    tagText: "text-violet-700",
  },
};

const defaultConfig = {
  iconName: "FileText",
  accentBorder: "border-l-slate-400",
  accentText: "text-slate-700",
  iconBg: "bg-slate-100",
  tagBg: "bg-slate-50",
  tagText: "text-slate-600",
};

// ─────────────────────────────────────────────────────────────
// Page
//
// Structure:
//   [HERO]         — title, subtitle, search, filter pills
//   [SECTION 1–6]  — categorized resource grids (no animations)
//   [CTA]          — soft demo prompt
//
// Section order follows revenue-impact hierarchy:
//   Phone Systems → After Hours → Costs → Discharge
//   → Automation → Comparisons
// ─────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const sections = categorizeResources(resources);

  return (
    <MarketingLayout
      navbar={{ variant: "solid", navigation: contentNavigation }}
      showScrollProgress
    >
      {/* HERO — DotPattern bg */}
      <ResourcesHero filterCategories={categories} />

      {/* STRUCTURED CONTENT SECTIONS */}
      {sections.map(({ category, resources: sectionResources }) => {
        const config = categoryConfig[category.id] ?? defaultConfig;
        // Map icon name to component
        const iconMap: Record<string, ElementType> = {
          Phone,
          Moon,
          DollarSign,
          FileText,
          Cpu,
          GitCompare,
        };
        const Icon = iconMap[config.iconName] ?? FileText;

        return (
          <section
            key={category.id}
            id={category.id}
            className="scroll-mt-20 border-b border-slate-100 bg-white py-16"
          >
            <div className="mx-auto max-w-6xl px-6">
              {/* Section header: hero text + icon on the right */}
              <div className="mb-12 flex items-start justify-between gap-5">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl lg:text-3xl">
                    {category.heading}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 lg:text-lg">
                    {category.intro}
                  </p>
                </div>
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.iconBg} shadow-md`}
                >
                  <Icon className={`h-7 w-7 ${config.accentText}`} />
                </div>
              </div>

              {/* Featured article with expandable grid */}
              <ResourceSection
                sectionResources={sectionResources}
                categoryConfig={config}
                categoryLabel={categoryLabelMap[category.id] ?? category.label}
              />

              {/* Cross-link to related solution - only show for key sections */}
              {category.relatedSolution &&
                (category.id === "phone-systems" ||
                  category.id === "discharge") && (
                  <div className="mt-8 flex justify-center">
                    <Link
                      href={`/solutions/${category.relatedSolution}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                    >
                      Looking for a solution instead?
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
            </div>
          </section>
        );
      })}

      {/* CTA — teal gradient */}
      <section className="relative overflow-hidden bg-linear-to-br from-teal-900 via-teal-800 to-teal-900 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            See how OdisAI automates these workflows
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-100/70">
            Most clinics go live within 48 hours. Book a quick demo to see it in
            action.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/solutions"
              className="text-sm font-medium text-teal-200 transition-colors hover:text-white"
            >
              View Solutions
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
