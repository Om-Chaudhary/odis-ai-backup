# SEO Setup Documentation

This document outlines the complete SEO implementation for the Odis AI Next.js application.

## Overview

The SEO setup includes comprehensive metadata, structured data, sitemaps, robots.txt, and semantic HTML structure optimized for search engines.

## Components Implemented

### 1. App Layout (`src/app/layout.tsx`)
- **Comprehensive metadata** with title templates, descriptions, keywords
- **Open Graph tags** for social media sharing
- **Twitter Card metadata** for Twitter sharing
- **JSON-LD structured data** for WebSite and Organization schemas
- **Proper viewport and charset configuration**
- **Canonical URL setup**

### 2. Sitemap (`src/app/sitemap.ts`)
- **Dynamic sitemap generation** with all main pages
- **Proper priority and change frequency** settings
- **Last modified dates** for each page
- **Uses environment variable** for site URL

### 3. Robots.txt (`src/app/robots.ts`)
- **Allows all user agents** for public pages
- **Blocks sensitive areas** (dashboard, API routes, auth)
- **Links to sitemap** for search engine discovery
- **Uses environment variable** for site URL

### 4. SEO Component (`src/components/SEO.tsx`)
- **Reusable SEO component** for page-specific metadata
- **Supports all major meta tags** (title, description, image, etc.)
- **Open Graph and Twitter Card** support
- **Article-specific metadata** for blog posts
- **Robots control** (noindex/nofollow)

### 5. Page Updates
- **Semantic HTML structure** with proper heading hierarchy
- **ARIA labels** for accessibility
- **Page-specific metadata** for login and dashboard pages
- **Proper main, section, and header elements**

### 6. Next.js Configuration (`next.config.js`)
- **Image optimization** with WebP and AVIF support
- **Security headers** (X-Frame-Options, CSP, etc.)
- **Caching headers** for sitemap and robots.txt
- **Compression enabled**
- **Performance optimizations**

## Environment Variables

Add the following environment variable to your `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=https://odisai.net
```

For development, it defaults to `https://odisai.net` but can be overridden.

## Key Features

### Metadata
- **Title templates** with fallbacks
- **Comprehensive descriptions** with veterinary practice keywords
- **Open Graph images** for social sharing
- **Twitter Card optimization**
- **Canonical URLs** to prevent duplicate content

### Structured Data
- **WebSite schema** with search functionality
- **Organization schema** with logo and social links
- **Proper JSON-LD formatting**

### Performance
- **Image optimization** with modern formats
- **Caching strategies** for static assets
- **Compression enabled**
- **Security headers** for better SEO scores

### Accessibility
- **Semantic HTML** structure
- **ARIA labels** for screen readers
- **Proper heading hierarchy**
- **Alt text support** for images

## Usage

### Using the SEO Component

```tsx
import SEO from "~/components/SEO";

export default function MyPage() {
  return (
    <>
      <SEO
        title="Custom Page Title"
        description="Custom page description"
        image="/custom-og-image.png"
        url="/custom-page"
        type="article"
        keywords={["custom", "keywords"]}
      />
      {/* Your page content */}
    </>
  );
}
```

### Page-Specific Metadata

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
  robots: {
    index: true,
    follow: true,
  },
};
```

## Next Steps

1. **Create actual Open Graph image** (1200x630px) and replace the placeholder
2. **Add Google Search Console verification** by setting `GOOGLE_SITE_VERIFICATION` environment variable
3. **Submit sitemap** to Google Search Console
4. **Monitor Core Web Vitals** and performance metrics
5. **Add more structured data** as needed (Product, Review, etc.)

## Testing

- Use Google's Rich Results Test to validate structured data
- Test Open Graph tags with Facebook's Sharing Debugger
- Validate sitemap at `/sitemap.xml`
- Check robots.txt at `/robots.txt`
- Use Lighthouse for SEO audit

## Maintenance

- Update sitemap when adding new pages
- Refresh structured data when business information changes
- Monitor search console for crawl errors
- Keep metadata descriptions under 160 characters
- Ensure all images have proper alt text
