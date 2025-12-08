import Head from "next/head";
import { env } from "~/env.js";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

export default function SEO({
  title = "Odis AI - Veterinary Practice Management Software",
  description = "Streamline your veterinary practice with Odis AI. Advanced practice management software designed for modern veterinary clinics.",
  image = "/og-image.png",
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author = "Odis AI",
  keywords = [],
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

  const defaultKeywords = [
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
  ];

  const allKeywords = [...defaultKeywords, ...keywords];

  const robotsContent = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
  ].join(", ");

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(", ")} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="Odis AI" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:creator" content="@odisai" />
      <meta name="twitter:site" content="@odisai" />

      {/* Article specific meta tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#31aba3" />
      <meta name="msapplication-TileColor" content="#31aba3" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Odis AI" />
    </Head>
  );
}
