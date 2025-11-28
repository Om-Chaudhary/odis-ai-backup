import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Inter } from "next/font/google";
import { Lora } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "~/styles/globals.css";
import ClientPostHogProvider from "~/components/ClientPostHogProvider";
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

const geistMono = GeistMono;

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: {
    default: "Odis AI - Veterinary Practice Management Software",
    template: "%s | Odis AI",
  },
  description:
    "Streamline your veterinary practice with Odis AI. Advanced practice management software designed for modern veterinary clinics. Features include patient management, appointment scheduling, billing, and more.",
  keywords: [
    "veterinary practice management",
    "veterinary software",
    "vet clinic management",
    "animal hospital software",
    "veterinary appointment scheduling",
    "vet billing software",
    "veterinary EMR",
    "pet clinic management",
    "veterinary practice automation",
    "vet clinic software",
  ],
  authors: [{ name: "Odis AI" }],
  creator: "Odis AI",
  publisher: "Odis AI",
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
    title: "Odis AI - Veterinary Practice Management Software",
    description:
      "Streamline your veterinary practice with Odis AI. Advanced practice management software designed for modern veterinary clinics.",
    siteName: "Odis AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Odis AI - Veterinary Practice Management Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odis AI - Veterinary Practice Management Software",
    description:
      "Streamline your veterinary practice with Odis AI. Advanced practice management software designed for modern veterinary clinics.",
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
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Odis AI",
      description: "Veterinary Practice Management Software",
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
      name: "Odis AI",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon-128.png`,
        width: 128,
        height: 128,
      },
      description:
        "Leading provider of veterinary practice management software",
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
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`font-sans ${outfit.variable} ${inter.variable} ${lora.variable} ${geistMono.variable}`}
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
