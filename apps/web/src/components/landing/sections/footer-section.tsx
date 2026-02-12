import { Shield, Lock, ArrowUpRight, Mail, Linkedin } from "lucide-react";
import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

type FooterSectionProps = {
  companyName?: string;
  tagline?: string;
  sections?: FooterSection[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    email?: string;
  };
  copyrightText?: string;
};

const defaultSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Book a Demo", href: "/demo" },
      { label: "Contact Us", href: "/contact" },
      { label: "hello@odis.ai", href: "mailto:hello@odis.ai" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
];

export const FooterSection = ({
  companyName = "OdisAI",
  tagline = "AI Voice Agents for Veterinary Clinics",
  sections = defaultSections,
  socialLinks = {
    linkedin: "https://linkedin.com/company/odisai",
    email: "hello@odis.ai",
  },
  copyrightText,
}: FooterSectionProps) => {
  const copyright =
    copyrightText ?? `© 2025 ${companyName}. All rights reserved.`;
  return (
    <footer className="bg-secondary/30 border-border w-full border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="mb-4">
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-800">
                {companyName}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-xs text-sm">
                {tagline}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  className="bg-background border-border text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:border-slate-400/30 hover:text-slate-700"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {socialLinks.email && (
                <a
                  href={`mailto:${socialLinks.email}`}
                  className="bg-background border-border text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:border-slate-400/30 hover:text-slate-700"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Link Sections */}
          {sections.map((section, index) => (
            <div key={index} className="col-span-1">
              <h4 className="mb-4 text-sm font-medium text-slate-700">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => {
                  const isExternal =
                    link.href.startsWith("mailto:") ||
                    link.href.startsWith("tel:") ||
                    link.href.startsWith("http");
                  const isAnchor = link.href.startsWith("#");

                  return (
                    <li key={linkIndex}>
                      {isExternal || isAnchor ? (
                        <a
                          href={link.href}
                          className="text-muted-foreground text-sm transition-colors duration-150 hover:text-slate-700"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-muted-foreground text-sm transition-colors duration-150 hover:text-slate-700"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-border border-t pt-8">
          <div className="flex flex-col items-center gap-6">
            {/* Compliance badges */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm">
                <Shield className="h-3 w-3 text-teal-600" />
                HIPAA Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm">
                <Lock className="h-3 w-3 text-teal-600" />
                256-bit Encryption
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm">
                <Shield className="h-3 w-3 text-teal-600" />
                SOC 2 Type II
              </span>
            </div>

            <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-muted-foreground text-sm">{copyright}</p>
              <a
                href="#home"
                className="group text-muted-foreground inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:text-slate-700"
              >
                Back to top
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
