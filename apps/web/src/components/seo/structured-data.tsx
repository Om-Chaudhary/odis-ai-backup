import { env } from "~/env.js";

export function StructuredData() {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  // JSON-LD structured data - Enhanced for rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // WebSite schema
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "OdisAI",
        description: "AI Voice Agents for Veterinary Clinics",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteUrl}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        ],
      },

      // Organization schema
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "OdisAI",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon-128.png`,
          width: 128,
          height: 128,
        },
        description:
          "Leading provider of AI voice agents for veterinary clinics",
        sameAs: [
          "https://twitter.com/odisai",
          "https://linkedin.com/company/odis-ai",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+1-925-678-5640",
          contactType: "sales",
          email: "hello@odis.ai",
          availableLanguage: "English",
        },
      },

      // SoftwareApplication schema - for rich software snippets
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "OdisAI",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Veterinary Practice Management",
        operatingSystem: "Web",
        description:
          "AI voice agents for veterinary clinics that handle inbound calls, schedule appointments, and automate discharge follow-ups 24/7.",
        url: siteUrl,
        softwareVersion: "2.0",
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "0",
          highPrice: "499",
          priceCurrency: "USD",
          offerCount: "3",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "47",
          bestRating: "5",
        },
        featureList: [
          "24/7 AI Voice Answering",
          "Appointment Scheduling",
          "Discharge Call Automation",
          "IDEXX Neo Integration",
          "Real-time Call Analytics",
          "Custom Voice Training",
        ],
        provider: {
          "@id": `${siteUrl}/#organization`,
        },
      },

      // FAQPage schema - for FAQ rich snippets in search results
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "How does OdisAI handle calls?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "OdisAI uses advanced AI voice technology to answer calls naturally, just like a trained receptionist. It can schedule appointments, answer common questions about your clinic, take messages, and route urgent calls to your team.",
            },
          },
          {
            "@type": "Question",
            name: "Will pet parents know they're talking to an AI?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Our AI is designed to sound natural and warm. Most callers don't realize they're speaking with AI—but we can configure transparent disclosure if your clinic prefers it.",
            },
          },
          {
            "@type": "Question",
            name: "How does it integrate with my practice management system?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "We currently offer deep integration with IDEXX Neo, with more PIMS integrations coming soon. The AI can check availability, book appointments, and log call notes directly in your system.",
            },
          },
          {
            "@type": "Question",
            name: "What happens if the AI can't answer a question?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The AI gracefully routes complex or urgent calls to your team. It can take a message, schedule a callback, or transfer directly—whatever workflow you prefer.",
            },
          },
          {
            "@type": "Question",
            name: "How long does setup take?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most clinics are fully live within 48 hours. We handle the technical setup and train the AI on your clinic's specific information, services, and scheduling rules.",
            },
          },
          {
            "@type": "Question",
            name: "Can it handle after-hours calls?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absolutely. OdisAI works 24/7, so pet parents can schedule appointments or get answers even when your clinic is closed.",
            },
          },
        ],
      },

      // Service schema - for service-based search queries
      {
        "@type": "Service",
        "@id": `${siteUrl}/#service`,
        name: "AI Voice Agent for Veterinary Clinics",
        serviceType: "AI Phone Answering Service",
        description:
          "24/7 AI-powered phone answering, appointment scheduling, and discharge call automation for veterinary practices.",
        provider: {
          "@id": `${siteUrl}/#organization`,
        },
        areaServed: {
          "@type": "Country",
          name: "United States",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "OdisAI Plans",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Starter Plan",
                description:
                  "Perfect for small practices getting started with AI",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Professional Plan",
                description: "Full-featured plan for growing practices",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Enterprise Plan",
                description: "Custom solutions for multi-location clinics",
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
