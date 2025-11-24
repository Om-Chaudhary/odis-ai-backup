import type { Metadata } from "next";
import { ComplianceDocument } from "~/components/legal/compliance-document";
import {
  privacyPolicySections,
  COMPANY_NAME,
  LAST_UPDATED,
  EFFECTIVE_DATE,
} from "./content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information. Our privacy policy explains your rights and our commitment to data security.`,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: `Privacy Policy | ${COMPANY_NAME}`,
    description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
    type: "website",
    url: "/privacy-policy",
  },
  twitter: {
    card: "summary",
    title: `Privacy Policy | ${COMPANY_NAME}`,
    description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
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
          title="Privacy Policy"
          lastUpdated={LAST_UPDATED}
          effectiveDate={EFFECTIVE_DATE}
          sections={privacyPolicySections}
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
