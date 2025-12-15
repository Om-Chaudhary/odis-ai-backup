import type { Metadata } from "next";
import { Outfit, Inter, Lora, Plus_Jakarta_Sans } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "~/styles/globals.css";
import ClientPostHogProvider from "~/components/providers/client-posthog-provider";
import { TRPCReactProvider } from "~/trpc/Provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { env } from "~/env.js";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const geistMono = GeistMono;

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: {
    default: "OdisAI - AI Voice Agents for Veterinary Clinics",
    template: "%s | OdisAI",
  },
  description:
    "Never miss another call. OdisAI handles your clinic's inbound and outbound calls with AI voice agents that sound natural, book appointments, and follow up with pet parents 24/7.",
  keywords: [
    "veterinary AI",
    "AI voice agents",
    "veterinary phone answering",
    "vet clinic automation",
    "pet parent follow-up",
    "veterinary appointment booking",
    "AI receptionist",
    "veterinary practice management",
    "animal hospital software",
    "24/7 veterinary phone service",
  ],
  authors: [{ name: "OdisAI" }],
  creator: "OdisAI",
  publisher: "OdisAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "OdisAI - AI Voice Agents for Veterinary Clinics",
    description:
      "Never miss another call. OdisAI handles your clinic's inbound and outbound calls with AI voice agents that sound natural, book appointments, and follow up with pet parents 24/7.",
    siteName: "OdisAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OdisAI - AI Voice Agents for Veterinary Clinics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OdisAI - AI Voice Agents for Veterinary Clinics",
    description:
      "Never miss another call. OdisAI handles your clinic's inbound and outbound calls with AI voice agents that sound natural, book appointments, and follow up with pet parents 24/7.",
    images: ["/og-image.png"],
    creator: "@odisai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/icon-128.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-128.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icon-128.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon-128.png",
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
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
      description: "Leading provider of AI voice agents for veterinary clinics",
      sameAs: [
        "https://twitter.com/odisai",
        "https://linkedin.com/company/odis-ai",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* JSON-LD structured data - must be in initial HTML for SEO crawlers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={`font-sans antialiased ${outfit.variable} ${inter.variable} ${lora.variable} ${plusJakarta.variable} ${geistMono.variable}`}
      >
        <ClientPostHogProvider>
          <TRPCReactProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </TRPCReactProvider>
        </ClientPostHogProvider>
      </body>
    </html>
  );
}
