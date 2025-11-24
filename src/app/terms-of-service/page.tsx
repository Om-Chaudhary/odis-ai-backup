import type { Metadata } from "next";
import { ComplianceDocument } from "~/components/legal/compliance-document";
import {
  termsOfServiceSections,
  COMPANY_NAME,
  LAST_UPDATED,
  EFFECTIVE_DATE,
} from "./content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Read the Terms of Service for ${COMPANY_NAME}. Understand your rights and responsibilities when using our services.`,
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    title: `Terms of Service | ${COMPANY_NAME}`,
    description: `Read the Terms of Service for ${COMPANY_NAME}.`,
    type: "website",
    url: "/terms-of-service",
  },
  twitter: {
    card: "summary",
    title: `Terms of Service | ${COMPANY_NAME}`,
    description: `Read the Terms of Service for ${COMPANY_NAME}.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <a
              href="/"
              className="text-lg font-semibold text-slate-900 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ← Back to Home
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ComplianceDocument
          title="Terms of Service"
          lastUpdated={LAST_UPDATED}
          effectiveDate={EFFECTIVE_DATE}
          sections={termsOfServiceSections}
        />
      </div>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-slate-600">
            <p>
              © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center gap-6">
              <a
                href="/privacy-policy"
                className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Privacy Policy
              </a>
              <a
                href="/terms-of-service"
                className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Terms of Service
              </a>
              <a
                href="/cookie-policy"
                className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
