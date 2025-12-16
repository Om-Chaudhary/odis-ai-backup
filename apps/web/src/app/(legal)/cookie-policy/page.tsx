import type { Metadata } from "next";
import Link from "next/link";
import { ComplianceDocument } from "~/components/legal/compliance-document";
import {
  cookiePolicySections,
  COMPANY_NAME,
  LAST_UPDATED,
  EFFECTIVE_DATE,
} from "./content";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `Learn how ${COMPANY_NAME} uses cookies and similar tracking technologies. Our cookie policy explains what cookies we use and how you can manage them.`,
  alternates: {
    canonical: "/cookie-policy",
  },
  openGraph: {
    title: `Cookie Policy | ${COMPANY_NAME}`,
    description: `Learn how ${COMPANY_NAME} uses cookies and similar tracking technologies.`,
    type: "website",
    url: "/cookie-policy",
  },
  twitter: {
    card: "summary",
    title: `Cookie Policy | ${COMPANY_NAME}`,
    description: `Learn how ${COMPANY_NAME} uses cookies and similar tracking technologies.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="hover:text-primary focus:ring-ring text-lg font-semibold text-slate-900 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              ← Back to Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ComplianceDocument
          title="Cookie Policy"
          lastUpdated={LAST_UPDATED}
          effectiveDate={EFFECTIVE_DATE}
          sections={cookiePolicySections}
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
              <Link
                href="/privacy-policy"
                className="hover:text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                className="hover:text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
