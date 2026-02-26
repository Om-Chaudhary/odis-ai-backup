import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
} from "~/components/marketing";
import { Check } from "lucide-react";
import { getPublicPageRobots } from "~/lib/metadata";

// Integration data - in production, this could come from a CMS or database
const integrations: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    longDescription: string;
    status: "live" | "coming-soon";
    features: Array<{
      title: string;
      description: string;
    }>;
    benefits: string[];
    faqs: Array<{
      question: string;
      answer: string;
    }>;
  }
> = {
  "idexx-neo": {
    name: "IDEXX Neo",
    tagline: "Deep integration with IDEXX Neo for seamless practice automation",
    description:
      "Connect OdisAI with IDEXX Neo for real-time appointment scheduling, automatic call logging, and patient data synchronization.",
    longDescription:
      "OdisAI's IDEXX Neo integration provides a seamless connection between your AI voice agent and your practice management system. When a pet parent calls, OdisAI can instantly access patient records, check appointment availability, and book appointments directly in your IDEXX Neo calendar. All call notes and outcomes are automatically logged, giving your team complete visibility without any manual data entry.",
    status: "live",
    features: [
      {
        title: "Real-Time Calendar Sync",
        description:
          "OdisAI reads your IDEXX Neo calendar in real-time to offer accurate appointment slots to callers.",
      },
      {
        title: "Automatic Call Logging",
        description:
          "Every call is documented with detailed notes, outcomes, and recordings linked to patient records.",
      },
      {
        title: "Patient Lookup",
        description:
          "During calls, OdisAI can look up patient information to provide personalized service.",
      },
      {
        title: "Appointment Booking",
        description:
          "Callers can book, reschedule, or cancel appointments without staff intervention.",
      },
      {
        title: "Discharge Call Automation",
        description:
          "Automatically trigger follow-up calls based on discharge events in IDEXX Neo.",
      },
      {
        title: "Custom Workflow Triggers",
        description:
          "Create automated workflows based on call outcomes and patient status updates.",
      },
    ],
    benefits: [
      "Eliminate double data entry between phone and practice system",
      "Reduce missed calls with 24/7 AI answering integrated with your calendar",
      "Improve patient care with automated discharge follow-ups",
      "Save 10+ hours per week on phone-related administrative tasks",
      "Get complete visibility into all client communications",
    ],
    faqs: [
      {
        question: "How long does the IDEXX Neo integration take to set up?",
        answer:
          "Most clinics are fully integrated within 24-48 hours. Our team handles the technical configuration and tests the connection before going live.",
      },
      {
        question: "Does OdisAI have access to all patient data in IDEXX Neo?",
        answer:
          "OdisAI only accesses the data needed for phone interactions: appointment availability, basic patient information, and communication preferences. Sensitive medical records remain secure.",
      },
      {
        question: "Can OdisAI book appointments for new patients?",
        answer:
          "Yes! OdisAI can create new patient records in IDEXX Neo and book their first appointment during the same call.",
      },
      {
        question:
          "What happens if there's a sync issue between OdisAI and IDEXX Neo?",
        answer:
          "Our system monitors the connection continuously. If any issues are detected, our team is alerted immediately and we'll work with you to resolve it quickly.",
      },
    ],
  },
  ezyvet: {
    name: "ezyVet",
    tagline:
      "Cloud-native integration with ezyVet for modern veterinary practices",
    description:
      "Connect OdisAI with ezyVet for seamless cloud-based practice management and AI-powered call automation.",
    longDescription:
      "OdisAI's ezyVet integration leverages ezyVet's powerful cloud-based API to deliver a seamless experience for modern veterinary practices. With real-time data sync, OdisAI can access your appointment calendar, patient records, and client information to handle calls intelligently. Whether it's booking appointments, answering questions about upcoming visits, or logging call outcomes, OdisAI works in perfect harmony with your ezyVet workflow.",
    status: "coming-soon",
    features: [
      {
        title: "Cloud-Based Calendar Access",
        description:
          "Access your ezyVet calendar from anywhere with real-time availability updates for accurate scheduling.",
      },
      {
        title: "Patient Record Integration",
        description:
          "Look up patient history and information during calls to provide personalized service to pet parents.",
      },
      {
        title: "Automated Call Documentation",
        description:
          "Every call is automatically logged in ezyVet with detailed notes, transcripts, and outcomes.",
      },
      {
        title: "Appointment Management",
        description:
          "Book, reschedule, and cancel appointments directly through voice calls without staff intervention.",
      },
      {
        title: "Client Communication Hub",
        description:
          "Centralize all client communications with call history visible alongside other touchpoints.",
      },
      {
        title: "Smart Reminder Integration",
        description:
          "Sync with ezyVet's reminder system to trigger automated follow-up calls at the right time.",
      },
    ],
    benefits: [
      "Leverage ezyVet's cloud architecture for reliable, always-on integration",
      "Reduce front desk workload by automating routine phone tasks",
      "Improve client satisfaction with 24/7 intelligent call handling",
      "Keep all client interactions documented in one place",
      "Scale your phone operations without adding staff",
    ],
    faqs: [
      {
        question: "When will the ezyVet integration be available?",
        answer:
          "We're currently in development with ezyVet integration and expect to launch in early 2025. Join our waitlist to be notified when it's ready.",
      },
      {
        question: "Will the integration work with all ezyVet plans?",
        answer:
          "Yes, OdisAI will integrate with all ezyVet subscription tiers that include API access.",
      },
      {
        question: "How does OdisAI handle ezyVet's multi-location features?",
        answer:
          "OdisAI is designed to work with multi-location practices, routing calls and booking appointments at the correct location based on caller preferences.",
      },
      {
        question: "Can I request early access to the ezyVet integration?",
        answer:
          "Absolutely! Contact our sales team to discuss early access options and help shape the integration based on your practice's needs.",
      },
    ],
  },
  cornerstone: {
    name: "Cornerstone",
    tagline:
      "Trusted integration with IDEXX Cornerstone for established practices",
    description:
      "Integrate OdisAI with IDEXX Cornerstone to modernize your phone operations while keeping your proven practice management system.",
    longDescription:
      "OdisAI's Cornerstone integration brings AI-powered voice automation to practices running IDEXX Cornerstone. We understand that Cornerstone is the backbone of thousands of successful veterinary practices, and our integration is designed to enhance your workflow without disrupting what works. OdisAI connects with your Cornerstone database to access schedules, patient records, and client information, enabling intelligent call handling that feels like an extension of your team.",
    status: "coming-soon",
    features: [
      {
        title: "Schedule Synchronization",
        description:
          "Real-time sync with your Cornerstone appointment schedule for accurate availability.",
      },
      {
        title: "Patient Data Access",
        description:
          "Securely access patient information to personalize calls and provide relevant details.",
      },
      {
        title: "Call Note Integration",
        description:
          "Automatic documentation of all calls with notes attached to the appropriate patient records.",
      },
      {
        title: "Appointment Reminders",
        description:
          "Trigger automated reminder calls based on upcoming appointments in Cornerstone.",
      },
      {
        title: "Discharge Follow-ups",
        description:
          "Automatically initiate post-visit calls when patients are discharged in Cornerstone.",
      },
      {
        title: "Client History Lookup",
        description:
          "Access client communication history to provide context-aware service on every call.",
      },
    ],
    benefits: [
      "Modernize phone operations without replacing your trusted PIMS",
      "Maintain data consistency between phone and practice management",
      "Reduce training burden with AI that learns your practice workflow",
      "Extend Cornerstone's capabilities with intelligent automation",
      "Keep pace with client expectations for 24/7 availability",
    ],
    faqs: [
      {
        question: "Is this integration compatible with Cornerstone 8 and 9?",
        answer:
          "We're building support for both Cornerstone 8 and 9, ensuring compatibility with the versions most practices are running today.",
      },
      {
        question: "How does OdisAI connect to our on-premise Cornerstone?",
        answer:
          "We use a secure connector that runs on your network, enabling OdisAI to access Cornerstone data while keeping everything within your control.",
      },
      {
        question: "Will this integration slow down our Cornerstone system?",
        answer:
          "No. The integration is optimized for minimal impact, with intelligent caching and efficient queries that don't affect your daily operations.",
      },
      {
        question: "When can we expect the Cornerstone integration?",
        answer:
          "Cornerstone integration is in active development. Contact us to join the beta program and get early access.",
      },
    ],
  },
  avimark: {
    name: "AVImark",
    tagline:
      "Seamless integration with AVImark for comprehensive practice automation",
    description:
      "Connect AVImark with OdisAI for automated phone handling that syncs perfectly with your practice management workflow.",
    longDescription:
      "OdisAI's AVImark integration brings intelligent voice AI to practices using Covetrus AVImark. By connecting directly with your AVImark database, OdisAI can handle incoming calls with full context - checking appointment availability, looking up patient information, and logging call outcomes automatically. This integration is designed for practices that want to enhance their client communication without changing the practice management system they know and trust.",
    status: "coming-soon",
    features: [
      {
        title: "Appointment Scheduling",
        description:
          "Book, modify, and cancel appointments directly in AVImark through voice calls.",
      },
      {
        title: "Patient Information Sync",
        description:
          "Access patient records during calls to provide personalized, informed service.",
      },
      {
        title: "Call Tracking & Logging",
        description:
          "Every call is documented in AVImark with complete notes and outcomes.",
      },
      {
        title: "Reminder Automation",
        description:
          "Trigger automated calls for vaccine reminders, checkups, and follow-ups.",
      },
      {
        title: "After-Hours Coverage",
        description:
          "Provide 24/7 intelligent answering that integrates with your AVImark schedule.",
      },
      {
        title: "Workflow Automation",
        description:
          "Create custom triggers based on AVImark events and call outcomes.",
      },
    ],
    benefits: [
      "Extend AVImark's functionality with AI-powered phone automation",
      "Reduce missed calls and capture more appointment opportunities",
      "Free up staff time for in-clinic patient care",
      "Maintain complete records of all client communications",
      "Improve client retention with proactive outreach",
    ],
    faqs: [
      {
        question: "Which versions of AVImark are supported?",
        answer:
          "We're developing support for AVImark versions commonly in use today. Contact us to confirm compatibility with your specific version.",
      },
      {
        question:
          "How is client data kept secure with the AVImark integration?",
        answer:
          "OdisAI uses encrypted connections and accesses only the minimum data needed for phone operations. All data remains in your control.",
      },
      {
        question: "Can OdisAI handle multi-doctor scheduling in AVImark?",
        answer:
          "Yes! OdisAI understands doctor-specific schedules and can book appointments with the right provider based on caller needs.",
      },
      {
        question: "What's the timeline for AVImark integration?",
        answer:
          "AVImark integration is planned for 2025. Join our waitlist to be among the first to access it.",
      },
    ],
  },
  "covetrus-pulse": {
    name: "Covetrus Pulse",
    tagline:
      "Modern cloud integration with Covetrus Pulse for growing practices",
    description:
      "Connect OdisAI with Covetrus Pulse for cloud-native AI voice automation that scales with your practice.",
    longDescription:
      "OdisAI's Covetrus Pulse integration is built for forward-thinking veterinary practices using Pulse's modern cloud platform. With native API connectivity, OdisAI delivers real-time access to your practice data for intelligent call handling. From booking appointments to logging discharge follow-ups, every interaction flows seamlessly into your Pulse workflow.",
    status: "coming-soon",
    features: [
      {
        title: "Native Cloud Integration",
        description:
          "Direct API connection with Covetrus Pulse for real-time data sync and reliability.",
      },
      {
        title: "Smart Scheduling",
        description:
          "Access appointment availability and book directly in Pulse during calls.",
      },
      {
        title: "Patient Context",
        description:
          "Pull patient history and visit details to provide informed, personalized service.",
      },
      {
        title: "Automated Workflows",
        description:
          "Trigger calls based on Pulse events like discharges, reminders, and follow-ups.",
      },
      {
        title: "Communication Logging",
        description:
          "All calls are documented in Pulse with full transcripts and outcomes.",
      },
      {
        title: "Multi-Location Support",
        description:
          "Handle calls across multiple locations with location-aware routing and booking.",
      },
    ],
    benefits: [
      "Take advantage of Pulse's modern architecture for reliable integration",
      "Scale phone operations alongside your growing practice",
      "Deliver consistent client experience across all locations",
      "Reduce administrative burden with automated call handling",
      "Stay ahead with AI-powered client communication",
    ],
    faqs: [
      {
        question: "When will Covetrus Pulse integration be available?",
        answer:
          "We're actively developing our Pulse integration. Contact us to join the early access program.",
      },
      {
        question: "Does this work with Pulse's mobile features?",
        answer:
          "Yes! OdisAI integrates with Pulse's full platform, complementing your mobile and desktop workflows.",
      },
      {
        question:
          "How quickly can we get set up once the integration launches?",
        answer:
          "Cloud integrations like Pulse are typically operational within 24-48 hours after signup.",
      },
      {
        question: "Can we be notified when Pulse integration is ready?",
        answer:
          "Absolutely! Sign up for our integration waitlist and we'll notify you as soon as it's available.",
      },
    ],
  },
  shepherd: {
    name: "Shepherd",
    tagline:
      "AI-native integration with Shepherd for next-generation practices",
    description:
      "Pair OdisAI with Shepherd for an AI-first veterinary practice experience from appointment booking to discharge follow-up.",
    longDescription:
      "OdisAI and Shepherd together create a powerful AI-native stack for modern veterinary practices. Both platforms are built with automation and intelligence at their core, making this integration a natural fit for practices that want to lead with technology. OdisAI handles your phone operations while Shepherd manages your practice, with data flowing seamlessly between them.",
    status: "coming-soon",
    features: [
      {
        title: "AI-to-AI Integration",
        description:
          "Two AI-native platforms working together for maximum automation and efficiency.",
      },
      {
        title: "Unified Client Experience",
        description:
          "Consistent, intelligent interactions whether clients call, text, or use your app.",
      },
      {
        title: "Real-Time Sync",
        description:
          "Instant data sync between OdisAI calls and your Shepherd practice management.",
      },
      {
        title: "Smart Appointment Booking",
        description:
          "AI-optimized scheduling that considers preferences, history, and availability.",
      },
      {
        title: "Automated Follow-ups",
        description:
          "Trigger discharge calls and check-ins based on Shepherd workflow events.",
      },
      {
        title: "Analytics Integration",
        description:
          "Combined insights from phone operations and practice management for full visibility.",
      },
    ],
    benefits: [
      "Build an AI-first practice with platforms designed to work together",
      "Maximize automation across all client touchpoints",
      "Lead your market with cutting-edge veterinary technology",
      "Reduce operational complexity with unified, intelligent systems",
      "Future-proof your practice with modern, scalable technology",
    ],
    faqs: [
      {
        question: "Is Shepherd integration available now?",
        answer:
          "We're in discussions with Shepherd for a native integration. Contact us to express interest and help prioritize development.",
      },
      {
        question: "What makes this integration different from others?",
        answer:
          "Both OdisAI and Shepherd are built AI-first, enabling deeper automation and smarter workflows than traditional PIMS integrations.",
      },
      {
        question: "Do I need to use both platforms for this to work?",
        answer:
          "Yes, this integration is specifically for practices using Shepherd as their practice management system.",
      },
      {
        question: "How can I learn more about the Shepherd integration?",
        answer:
          "Contact our team to discuss timeline, features, and how this integration can benefit your practice.",
      },
    ],
  },
  vetspire: {
    name: "VetSpire",
    tagline:
      "Enterprise integration with VetSpire for multi-location practices",
    description:
      "Connect OdisAI with VetSpire for enterprise-grade AI voice automation across your veterinary network.",
    longDescription:
      "OdisAI's VetSpire integration is designed for multi-location veterinary groups and hospitals using VetSpire's enterprise platform. With robust API connectivity and multi-tenant support, OdisAI can handle calls across your entire network while respecting location-specific schedules, protocols, and workflows. Centralize your phone operations without losing the personal touch that makes each location special.",
    status: "coming-soon",
    features: [
      {
        title: "Multi-Location Management",
        description:
          "Handle calls across all locations with location-aware routing and scheduling.",
      },
      {
        title: "Enterprise Scheduling",
        description:
          "Access complex schedules with multi-provider, multi-location availability.",
      },
      {
        title: "Centralized Reporting",
        description:
          "Unified analytics across all locations for network-wide visibility.",
      },
      {
        title: "Custom Protocols",
        description:
          "Configure location-specific call handling rules and workflows.",
      },
      {
        title: "Patient Record Access",
        description:
          "Secure access to patient information for personalized call handling.",
      },
      {
        title: "Automated Campaigns",
        description:
          "Run coordinated outreach campaigns across your entire network.",
      },
    ],
    benefits: [
      "Scale phone operations across your entire veterinary network",
      "Maintain consistency while respecting location differences",
      "Reduce per-location staffing needs for phone coverage",
      "Get network-wide insights into client communications",
      "Simplify operations with centralized call management",
    ],
    faqs: [
      {
        question:
          "Is VetSpire integration suitable for single-location practices?",
        answer:
          "While designed for multi-location groups, single-location VetSpire users can also benefit from the integration.",
      },
      {
        question:
          "How does OdisAI handle different protocols at each location?",
        answer:
          "You can configure location-specific rules for call handling, scheduling, and escalation while maintaining network-wide standards.",
      },
      {
        question: "What's required for enterprise implementation?",
        answer:
          "Contact our enterprise team for a custom implementation plan tailored to your network's needs.",
      },
      {
        question: "When will VetSpire integration be available?",
        answer:
          "Enterprise integrations are developed in partnership with customers. Contact us to discuss your requirements.",
      },
    ],
  },
};

// Generate static params for all integration pages
export function generateStaticParams() {
  return Object.keys(integrations).map((slug) => ({
    slug,
  }));
}

// Generate metadata dynamically based on the integration
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const integration = integrations[slug];

  if (!integration) {
    return {
      title: "Integration Not Found",
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://odis-ai-web.vercel.app";

  return {
    title: `OdisAI + ${integration.name} Integration | Veterinary AI Voice Agents`,
    description: integration.description,
    keywords: [
      `${integration.name} integration`,
      `${integration.name} AI voice`,
      `${integration.name} phone automation`,
      "veterinary PIMS integration",
      "practice management integration",
      `OdisAI ${integration.name}`,
    ],
    alternates: {
      canonical: `${siteUrl}/integrations/${slug}`,
    },
    openGraph: {
      title: `OdisAI + ${integration.name} Integration`,
      description: integration.description,
      url: `${siteUrl}/integrations/${slug}`,
    },
    robots: getPublicPageRobots(),
  };
}

export default async function IntegrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const integration = integrations[slug];

  if (!integration) {
    notFound();
  }

  // JSON-LD for the integration page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `OdisAI + ${integration.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: integration.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <PageHero
        badge={`Integration`}
        title={`OdisAI + ${integration.name}`}
        subtitle={integration.tagline}
        backgroundVariant="hero-glow"
      />

      {/* Overview Section */}
      <SectionContainer
        id="overview"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-lg leading-relaxed text-slate-600">
            {integration.longDescription}
          </p>
        </div>
      </SectionContainer>

      {/* Features Section */}
      <SectionContainer
        id="features"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="Features"
          title={`What You Get with ${integration.name} Integration`}
          align="center"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {integration.features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <h3 className="mb-2 font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* Benefits Section */}
      <SectionContainer
        id="benefits"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Benefits"
          title="Why Integrate OdisAI with Your PIMS?"
          align="center"
        />

        <div className="mx-auto mt-12 max-w-2xl">
          <ul className="space-y-4">
            {integration.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                <span className="text-slate-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer
        id="faq"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="FAQ"
          title={`${integration.name} Integration Questions`}
          align="center"
        />

        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {integration.faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <h3 className="mb-2 font-semibold text-slate-900">
                {faq.question}
              </h3>
              <p className="text-sm text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* Breadcrumb for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: process.env.NEXT_PUBLIC_SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Integrations",
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/integrations`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: integration.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/integrations/${slug}`,
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      {/* CTA Section */}
      <CTASection
        badge="Get Started"
        title={`Ready to Connect OdisAI with ${integration.name}?`}
        subtitle="Schedule a demo to see the integration in action and get started in 48 hours or less."
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />

      {/* Back link */}
      <div className="py-8 text-center">
        <Link
          href="/integrations"
          className="text-sm text-slate-600 hover:text-teal-600"
        >
          ← View all integrations
        </Link>
      </div>
    </MarketingLayout>
  );
}
