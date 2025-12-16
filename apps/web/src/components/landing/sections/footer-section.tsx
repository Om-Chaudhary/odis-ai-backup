"use client";
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

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

// Only include links that work (anchor links to sections on page or real pages)
const defaultSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Integrations", href: "#integrations" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Contact",
    links: [
      {
        label: "Book a Demo",
        href: "mailto:hello@odis.ai?subject=Demo Request",
      },
      { label: "hello@odis.ai", href: "mailto:hello@odis.ai" },
      { label: "(925) 678-5640", href: "tel:+19256785640" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
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
  const currentYear = new Date().getFullYear();
  const copyright =
    copyrightText ?? `© ${currentYear} ${companyName}. All rights reserved.`;
  return (
    <footer className="bg-secondary/30 border-border w-full border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="col-span-1 sm:col-span-2 lg:col-span-2"
          >
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
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  className="bg-background border-border text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:border-slate-400/30 hover:text-slate-700"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  className="bg-background border-border text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:border-slate-400/30 hover:text-slate-700"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  className="bg-background border-border text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:border-slate-400/30 hover:text-slate-700"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
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
          </motion.div>

          {/* Link Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              className="col-span-1"
            >
              <h4 className="mb-4 text-sm font-medium text-slate-700">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-muted-foreground text-sm transition-colors duration-150 hover:text-slate-700"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="border-border border-t pt-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-muted-foreground text-sm">{copyright}</p>
            <a
              href="#top"
              className="group text-muted-foreground inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:text-slate-700"
            >
              Back to top
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
