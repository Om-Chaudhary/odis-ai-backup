import Link from "next/link";
import { Mail, MapPin, Linkedin } from "lucide-react";
import { Logo } from "~/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
                  <Logo size="md" />
                </div>
                <span className="font-display text-xl font-semibold text-slate-900">
                  Odis AI
                </span>
              </div>
              <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-600">
                Revolutionizing veterinary practice management with intelligent
                AI solutions. Streamline your workflow and enhance patient care.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-teal-600" />
                  <span>admin@odisai.net</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  <span>Livermore, California</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    className="text-sm text-slate-600 transition-colors hover:text-teal-600"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-sm text-slate-600 transition-colors hover:text-teal-600"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-sm text-slate-600 transition-colors hover:text-teal-600"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/support"
                    className="text-sm text-slate-600 transition-colors hover:text-teal-600"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-sm text-slate-600 transition-colors hover:text-teal-600"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-sm text-slate-600 transition-colors hover:text-teal-600"
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-slate-200/60 py-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} Odis AI. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex items-center space-x-6">
              <Link
                href="/privacy-policy"
                className="text-sm text-slate-500 transition-colors hover:text-teal-600"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-sm text-slate-500 transition-colors hover:text-teal-600"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                className="text-sm text-slate-500 transition-colors hover:text-teal-600"
              >
                Cookie Policy
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <Link
                href="https://www.linkedin.com/company/odisai/"
                className="text-slate-400 transition-colors hover:text-teal-600"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
