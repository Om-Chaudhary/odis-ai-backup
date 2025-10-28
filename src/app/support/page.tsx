"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import FAQ from "~/components/FAQ";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import {
  BookOpen,
  MessageCircle,
  Video,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";

const supportCategories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description:
      "Learn the basics of OdisAI and how to set up your practice management system.",
    topics: [
      "Quick start guide",
      "Account setup",
      "First integration",
      "Team onboarding",
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Settings,
    title: "Integration Guide",
    description:
      "Connect OdisAI with your existing practice management software seamlessly.",
    topics: [
      "Avimark integration",
      "Cornerstone setup",
      "ezyVet connection",
      "IDEXX Neo sync",
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: Zap,
    title: "Features & Usage",
    description:
      "Discover how to use OdisAI's powerful features to streamline your workflow.",
    topics: [
      "Automated data entry",
      "Appointment scheduling",
      "Report generation",
      "AI insights",
    ],
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description:
      "Learn about our security measures and how we protect your practice data.",
    topics: [
      "Data encryption",
      "HIPAA compliance",
      "Access controls",
      "Backup procedures",
    ],
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: FileText,
    title: "Documentation",
    description:
      "Comprehensive guides, API references, and technical documentation.",
    topics: [
      "API documentation",
      "User manuals",
      "Best practices",
      "Troubleshooting",
    ],
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description:
      "Watch step-by-step video guides to master OdisAI features quickly.",
    topics: [
      "Setup walkthrough",
      "Feature demos",
      "Tips & tricks",
      "Webinar recordings",
    ],
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
];

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    action: "Start Chat",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us a detailed message at support@odis.ai",
    action: "Send Email",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Call us at 1-800-ODIS-AI for immediate assistance",
    action: "Call Now",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
];

export default function SupportPage() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();

  useEffect(() => {
    posthog.capture("support_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  return (
    <main className="relative">
      <div className="dotted-background" />
      <Navigation />

      {/* Hero Section */}
      <section className="relative px-4 pb-16 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <HelpCircle className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Support Hub
            </span>
          </div>
          <h1 className="font-display mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            How can we help you today?
          </h1>
          <p className="mx-auto max-w-3xl font-serif text-lg leading-relaxed text-gray-700 sm:text-xl">
            Find answers, learn best practices, and get the support you need to
            make the most of OdisAI for your veterinary practice.
          </p>
        </div>
      </section>

      {/* Support Categories */}
      <section
        className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16"
        aria-label="Support categories"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Browse by Category
            </h2>
            <p className="mx-auto max-w-2xl font-serif text-gray-600">
              Explore our comprehensive resources organized by topic
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supportCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card
                  key={index}
                  className="group cursor-pointer border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <CardHeader>
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${category.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <CardTitle className="text-xl text-gray-900">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.topics.map((topic, topicIndex) => (
                        <li
                          key={topicIndex}
                          className="flex items-start text-sm text-gray-600"
                        >
                          <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#31aba3]" />
                          <span className="group-hover:text-[#31aba3] transition-colors">
                            {topic}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section
        className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16"
        aria-label="Contact support"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
              <MessageCircle className="mr-2 h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-semibold text-[#31aba3]">
                Get in Touch
              </span>
            </div>
            <h2 className="font-display mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Need Direct Support?
            </h2>
            <p className="mx-auto max-w-2xl font-serif text-gray-600">
              Our team is available 24/7 to help you with any questions or
              issues
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card
                  key={index}
                  className="border-gray-200 text-center transition-all duration-300 hover:shadow-lg"
                >
                  <CardHeader className="items-center">
                    <div
                      className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${option.bgColor}`}
                    >
                      <Icon className={`h-8 w-8 ${option.color}`} />
                    </div>
                    <CardTitle className="text-xl text-gray-900">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <button
                      className={`w-full rounded-lg ${option.bgColor} px-4 py-2 font-medium ${option.color} transition-all hover:scale-105`}
                    >
                      {option.action}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="FAQ">
        <FAQ />
      </section>

      {/* Additional Resources */}
      <section
        className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16"
        aria-label="Additional resources"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-gradient-to-br from-[#31aba3]/10 to-[#31aba3]/5 p-8 text-center sm:p-12">
            <h2 className="font-display mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Still have questions?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl font-serif text-gray-600">
              Can&apos;t find what you&apos;re looking for? Our support team is
              ready to help you get the answers you need.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg bg-[#31aba3] px-6 py-3 font-semibold text-white transition-all hover:bg-[#2a9589] hover:scale-105"
              >
                Contact Support
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-lg border-2 border-[#31aba3] px-6 py-3 font-semibold text-[#31aba3] transition-all hover:bg-[#31aba3]/5 hover:scale-105"
              >
                Visit Blog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-8 sm:mt-12 md:mt-16">
        <Footer />
      </footer>
    </main>
  );
}
