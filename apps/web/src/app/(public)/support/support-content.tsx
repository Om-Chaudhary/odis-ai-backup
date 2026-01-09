"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
} from "~/components/marketing";
import FAQ from "~/components/marketing/faq";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import {
  BookOpen,
  MessageCircle,
  Video,
  FileText,
  Mail,
  Settings,
  Shield,
  Zap,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import Link from "next/link";
import { Button } from "@odis-ai/shared/ui/button";

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
    href: "/demo",
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
    href: "/integrations",
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
    href: "/features",
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
    href: "/security",
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
    href: "/contact",
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
    href: "/demo",
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
    hoverBg: "hover:bg-teal-100",
    href: "mailto:support@odis.ai?subject=Support%20Chat%20Request",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us a detailed message at support@odis.ai",
    action: "Send Email",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    href: "mailto:support@odis.ai",
  },
];

export default function SupportContent() {
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
    <MarketingLayout navbar={{ variant: "transparent" }}>
      {/* Hero Section */}
      <PageHero
        badge="Support Hub"
        title="How can we help you today?"
        subtitle="Find answers, learn best practices, and get the support you need to make the most of OdisAI for your veterinary practice."
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/support" },
        ]}
      />

      {/* Support Categories */}
      <SectionContainer backgroundVariant="cool-blue" padding="default">
        <SectionHeader
          title="Browse by Category"
          subtitle="Explore our comprehensive resources organized by topic"
          align="center"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {supportCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link key={index} href={category.href}>
                <Card className="group h-full border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader>
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${category.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                      {category.title}
                      <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.topics.map((topic, topicIndex) => (
                        <li
                          key={topicIndex}
                          className="flex items-start text-sm text-slate-600"
                        >
                          <span className="mt-1.5 mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                          <span className="transition-colors group-hover:text-teal-600">
                            {topic}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </SectionContainer>

      {/* Contact Support Section */}
      <SectionContainer backgroundVariant="subtle-warm" padding="default">
        <SectionHeader
          badge="Get in Touch"
          title="Need Direct Support?"
          subtitle="Our team is available to help you with any questions or issues"
          align="center"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contactOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card
                key={index}
                className="border-slate-200 text-center transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="items-center">
                  <div
                    className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${option.bgColor}`}
                  >
                    <Icon className={`h-8 w-8 ${option.color}`} />
                  </div>
                  <CardTitle className="text-xl text-slate-900">
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="ghost"
                    className={`w-full rounded-lg ${option.bgColor} ${option.hoverBg} font-medium ${option.color} transition-all`}
                  >
                    <a href={option.href}>{option.action}</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer backgroundVariant="cool-blue" padding="default">
        <FAQ />
      </SectionContainer>

      {/* CTA Section */}
      <CTASection
        title="Still have questions?"
        subtitle="Can't find what you're looking for? Our support team is ready to help you get the answers you need."
        primaryCTAText="Contact Support"
        primaryCTAHref="/contact"
        secondaryCTAText="Visit Blog"
        secondaryCTAHref="/blog"
      />
    </MarketingLayout>
  );
}
