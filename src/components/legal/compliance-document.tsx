"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export interface ComplianceSection {
  id: string;
  title: string;
  content: React.ReactNode;
  subsections?: ComplianceSection[];
}

export interface ComplianceDocumentProps {
  title: string;
  lastUpdated: string;
  effectiveDate?: string;
  sections: ComplianceSection[];
  className?: string;
}

export function ComplianceDocument({
  title,
  lastUpdated,
  effectiveDate,
  sections,
  className,
}: ComplianceDocumentProps) {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for fixed header if any
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      element.focus({ preventScroll: true });
    }
  };

  return (
    <div className={cn("compliance-document", className)}>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="mb-8 border-b pb-6 print:border-b-2">
        <h1
          className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          id="document-title"
        >
          {title}
        </h1>
        <div className="flex flex-col gap-2 text-sm text-slate-600">
          {effectiveDate && (
            <p>
              <span className="font-semibold">Effective Date:</span>{" "}
              {effectiveDate}
            </p>
          )}
          <p>
            <span className="font-semibold">Last Updated:</span> {lastUpdated}
          </p>
        </div>
      </header>

      {/* Table of Contents */}
      <nav
        className="mb-12 rounded-lg border bg-slate-50 p-6 print:border-2 print:bg-transparent"
        aria-labelledby="toc-heading"
      >
        <h2
          id="toc-heading"
          className="mb-4 text-lg font-semibold text-slate-900"
        >
          Table of Contents
        </h2>
        <ol className="space-y-2 text-sm">
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className="text-primary focus:ring-ring text-left hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none print:text-black"
              >
                {index + 1}. {section.title}
              </button>
              {section.subsections && section.subsections.length > 0 && (
                <ol className="mt-2 ml-6 space-y-1">
                  {section.subsections.map((subsection, subIndex) => (
                    <li key={subsection.id}>
                      <button
                        onClick={() => scrollToSection(subsection.id)}
                        className="hover:text-primary focus:ring-ring text-left text-slate-600 hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none print:text-black"
                      >
                        {index + 1}.{subIndex + 1} {subsection.title}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className="space-y-12">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-20"
              tabIndex={-1}
            >
              <h2
                id={`${section.id}-heading`}
                className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl"
              >
                {index + 1}. {section.title}
              </h2>
              <div className="prose prose-slate prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-slate-900 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 max-w-none text-base leading-relaxed text-slate-700 print:text-sm">
                {section.content}
              </div>

              {section.subsections && section.subsections.length > 0 && (
                <div className="mt-6 space-y-8">
                  {section.subsections.map((subsection, subIndex) => (
                    <div
                      key={subsection.id}
                      id={subsection.id}
                      className="scroll-mt-20"
                      tabIndex={-1}
                    >
                      <h3
                        id={`${subsection.id}-heading`}
                        className="mb-3 text-xl font-semibold text-slate-900"
                      >
                        {index + 1}.{subIndex + 1} {subsection.title}
                      </h3>
                      <div className="prose prose-slate prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-slate-900 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 max-w-none text-base leading-relaxed text-slate-700 print:text-sm">
                        {subsection.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {/* Back to Top Button */}
      <Button
        onClick={scrollToTop}
        size="icon"
        className={cn(
          "fixed right-8 bottom-8 z-50 shadow-lg transition-all duration-300 print:hidden",
          showBackToTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-label="Back to top"
        title="Back to top"
      >
        <ArrowUp className="size-5" />
      </Button>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
          }

          .compliance-document {
            max-width: 100%;
          }

          button {
            text-decoration: underline;
            color: #000;
          }

          a {
            color: #000;
            text-decoration: underline;
          }

          h1 {
            font-size: 24pt;
            page-break-after: avoid;
          }

          h2 {
            font-size: 18pt;
            page-break-after: avoid;
            margin-top: 20pt;
          }

          h3 {
            font-size: 14pt;
            page-break-after: avoid;
            margin-top: 12pt;
          }

          section {
            page-break-inside: avoid;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
