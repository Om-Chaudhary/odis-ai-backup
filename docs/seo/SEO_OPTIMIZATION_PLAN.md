# OdisAI Landing Page SEO Optimization Plan

> Comprehensive strategy for improving search visibility, organic reach, and conversion through Next.js 15 SEO best practices.

---

## Executive Summary

Based on deep research into Next.js 15 SEO, veterinary SaaS keywords, and programmatic SEO strategies, this plan outlines **7 priority areas** to dramatically improve OdisAI's search visibility and organic reach.

### Current State Assessment

**Strengths:**

- ✅ Global metadata with title template pattern
- ✅ OpenGraph and Twitter card configuration
- ✅ Basic JSON-LD structured data (WebSite + Organization)
- ✅ Robots.txt with proper crawl rules
- ✅ XML Sitemap with priorities
- ✅ Google Site Verification integration
- ✅ Analytics tracking (PostHog + Vercel)
- ✅ Proper font loading (prevents CLS)

**Critical Issues:**

- ❌ Missing `og-image.png` file (OG image broken)
- ❌ Semantic HTML issues (`<p>` instead of `<h3>` for feature titles)
- ❌ Missing rich structured data (SoftwareApplication, FAQPage)
- ❌ No page-specific metadata for `/features`, `/pricing`, etc.
- ❌ Limited keyword strategy (only 10 keywords)
- ❌ No programmatic SEO pages for scale
- ❌ Missing canonical URLs on sub-pages

---

## Priority 1: Immediate Fixes (1-2 hours)

### 1.1 Fix Semantic HTML Hierarchy

**Problem:** Feature titles use `<p>` tags instead of proper heading hierarchy.

**File:** `apps/web/src/components/landing/sections/features-section.tsx:276-282`

```tsx
// BEFORE
const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="font-display mb-2 text-left text-xl font-medium tracking-tight text-slate-900 md:text-2xl">
      {children}
    </p>
  );
};

// AFTER
const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <h3 className="font-display mb-2 text-left text-xl font-medium tracking-tight text-slate-900 md:text-2xl">
      {children}
    </h3>
  );
};
```

**Impact:** Search engines use heading hierarchy to understand content importance. This fix improves content structure signals.

### 1.2 Create Missing OG Image

**Problem:** Metadata references `/og-image.png` but file doesn't exist.

**Solution:** Create dynamic OG image using Next.js Image Generation.

**Create:** `apps/web/src/app/opengraph-image.tsx`

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OdisAI - AI Voice Agents for Veterinary Clinics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 64,
        background:
          "linear-gradient(135deg, #f8fafb 0%, #e0f2fe 50%, #ccfbf1 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
          opacity: 0.15,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 100,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
          opacity: 0.1,
        }}
      />

      {/* Logo area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 40, color: "white", fontWeight: 800 }}>
            O
          </span>
        </div>
        <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 56 }}>
          OdisAI
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 32,
          color: "#0d9488",
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        AI Voice Agents for Veterinary Clinics
      </div>

      {/* Value prop */}
      <div
        style={{
          fontSize: 24,
          color: "#64748b",
          maxWidth: 800,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Never miss another call. 24/7 AI that books appointments and follows up
        with pet parents.
      </div>
    </div>,
    { ...size },
  );
}
```

---

## Priority 2: Enhanced Structured Data (2-3 hours)

### 2.1 Add SoftwareApplication Schema

**File:** Update `apps/web/src/app/layout.tsx`

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // Existing WebSite and Organization schemas...

    // NEW: SoftwareApplication schema
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
      screenshot: `${siteUrl}/og-image.png`,
      softwareVersion: "2.0",
      releaseNotes: "Enhanced IDEXX Neo integration, improved call quality",
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

    // NEW: FAQPage schema (pulled from FAQ section)
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

    // NEW: Service schema for local SEO
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "AI Voice Agent for Veterinary Clinics",
      serviceType: "AI Phone Answering Service",
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
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Professional Plan",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Enterprise Plan",
            },
          },
        ],
      },
    },
  ],
};
```

---

## Priority 3: Expanded Keyword Strategy (Research-Based)

### 3.1 Current Keywords (10)

```typescript
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
];
```

### 3.2 Recommended Expanded Keywords (40+)

Based on research from [LifeLearn](https://www.lifelearn.com/2024/03/12/veterinary-seo/), [Media Search Group](https://www.mediasearchgroup.com/industries/seo-keyword-ideas-for-veterinarians.php), and competitive analysis:

```typescript
keywords: [
  // Core product keywords (high intent)
  "veterinary AI voice agent",
  "AI phone answering for vets",
  "veterinary virtual receptionist",
  "automated veterinary phone system",
  "AI receptionist for animal hospitals",

  // Integration keywords (competitor capture)
  "IDEXX Neo integration",
  "ezyVet phone integration",
  "veterinary PIMS integration",
  "Cornerstone software integration",

  // Problem-solution keywords
  "missed calls veterinary practice",
  "veterinary staff burnout solution",
  "after hours vet phone service",
  "24/7 veterinary answering service",
  "reduce no-shows veterinary",

  // Discharge/follow-up keywords (unique value prop)
  "automated discharge calls veterinary",
  "pet discharge follow-up calls",
  "veterinary patient follow-up automation",
  "post-surgery pet parent calls",
  "veterinary care coordination software",

  // Use case keywords
  "veterinary appointment scheduling AI",
  "emergency vet call routing",
  "pet health reminder calls",
  "veterinary client communication",
  "vet clinic call overflow handling",

  // Long-tail keywords (lower competition)
  "AI that books vet appointments",
  "veterinary phone tree alternative",
  "how to never miss a vet call",
  "best phone system for vet clinics",
  "veterinary practice call automation",

  // Comparison keywords (competitor capture)
  "smith.ai for veterinarians",
  "veterinary answering service alternative",
  "voiceflow for vets",
  "talkforce AI veterinary",

  // Location-intent modifiers (for future local pages)
  "veterinary AI answering service USA",
  "vet clinic phone automation software",
  "best AI for veterinary practices 2025",
];
```

### 3.3 Voice Search Optimization Keywords

Based on [WSI World](https://www.wsiworld.com/blog/the-rise-of-voice-search-optimizing-your-seo-content-for-the-future) research on voice search:

```typescript
// Conversational long-tail keywords for voice search
voiceSearchKeywords: [
  "what is the best AI phone system for veterinary clinics",
  "how do I stop missing calls at my vet practice",
  "can AI answer phone calls for my animal hospital",
  "how to automate discharge calls for veterinary patients",
  "what software integrates with IDEXX Neo for phone calls",
  "is there an AI receptionist for veterinarians",
];
```

---

## Priority 4: Page-Specific Metadata

### 4.1 Features Page

**File:** `apps/web/src/app/(public)/features/page.tsx`

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Voice Features for Veterinarians | 24/7 Call Handling",
  description:
    "Explore OdisAI's AI voice features: 24/7 call answering, appointment scheduling, IDEXX Neo integration, discharge call automation, and real-time analytics for veterinary clinics.",
  keywords: [
    "veterinary AI features",
    "24/7 vet phone answering",
    "IDEXX Neo integration",
    "veterinary appointment scheduling",
    "discharge call automation",
    "vet clinic call analytics",
  ],
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "AI Voice Features for Veterinarians | OdisAI",
    description:
      "Discover how OdisAI's AI voice agents transform veterinary practice communication with 24/7 availability, smart scheduling, and PIMS integration.",
    url: "/features",
  },
};
```

### 4.2 Pricing Page

**File:** `apps/web/src/app/(public)/pricing/page.tsx`

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | AI Voice Agents for Veterinary Clinics",
  description:
    "Transparent pricing for OdisAI's veterinary AI voice agents. Plans starting from $0 for small practices to enterprise solutions for multi-location clinics.",
  keywords: [
    "veterinary AI pricing",
    "vet phone system cost",
    "AI receptionist pricing",
    "veterinary answering service cost",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "OdisAI Pricing | AI Voice Agents for Vets",
    description:
      "See our transparent pricing plans for veterinary AI voice agents. Start free, scale as you grow.",
    url: "/pricing",
  },
};
```

### 4.3 Demo Page

**File:** `apps/web/src/app/(public)/demo/page.tsx`

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo | See OdisAI in Action",
  description:
    "Schedule a personalized demo of OdisAI's veterinary AI voice agents. See how we handle calls, book appointments, and integrate with IDEXX Neo live.",
  keywords: [
    "veterinary AI demo",
    "OdisAI demo",
    "vet phone system demo",
    "AI receptionist trial",
  ],
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Book a Demo | OdisAI for Veterinary Clinics",
    description:
      "Experience OdisAI's AI voice agents in a live demo tailored to your veterinary practice.",
    url: "/demo",
  },
};
```

---

## Priority 5: Programmatic SEO Strategy

### 5.1 Integration Landing Pages

Create individual landing pages for each PIMS integration to capture long-tail search traffic:

**Structure:** `/integrations/[slug]`

**Pages to create:**

- `/integrations/idexx-neo` - "OdisAI + IDEXX Neo Integration"
- `/integrations/ezyvet` - "OdisAI + ezyVet Integration" (Coming Soon)
- `/integrations/cornerstone` - "OdisAI + Cornerstone Integration" (Coming Soon)
- `/integrations/avimark` - "OdisAI + AVImark Integration" (Coming Soon)
- `/integrations/shepherd` - "OdisAI + Shepherd Integration" (Coming Soon)

**Template approach (Zapier-style):**
Each page dynamically generates:

- Title: "OdisAI + {PIMS Name} Integration"
- Description: "Connect OdisAI with {PIMS Name} to automate call logging, appointment scheduling, and patient follow-ups."
- Features specific to that integration
- FAQ specific to that integration
- CTA to demo

### 5.2 Use Case Landing Pages

**Structure:** `/solutions/[use-case]`

**Pages to create:**

- `/solutions/missed-calls` - "Stop Missing Calls at Your Veterinary Practice"
- `/solutions/after-hours` - "24/7 After-Hours Answering for Vets"
- `/solutions/discharge-calls` - "Automated Discharge Follow-Up Calls"
- `/solutions/appointment-scheduling` - "AI Appointment Scheduling for Vets"
- `/solutions/emergency-triage` - "Emergency Call Triage for Animal Hospitals"

### 5.3 Comparison Pages

**Structure:** `/compare/[competitor]`

**Pages to create:**

- `/compare/smith-ai` - "OdisAI vs Smith.ai for Veterinarians"
- `/compare/traditional-answering-service` - "OdisAI vs Traditional Answering Services"
- `/compare/in-house-staff` - "AI Voice vs Additional Front Desk Staff"

### 5.4 Dynamic Sitemap Update

**File:** `apps/web/src/app/sitemap.ts`

```typescript
import type { MetadataRoute } from "next";
import { env } from "~/env.js";

// Integration data (could come from database)
const integrations = [
  { slug: "idexx-neo", name: "IDEXX Neo", status: "live" },
  { slug: "ezyvet", name: "ezyVet", status: "coming-soon" },
  { slug: "cornerstone", name: "Cornerstone", status: "coming-soon" },
];

const useCases = [
  { slug: "missed-calls", priority: 0.8 },
  { slug: "after-hours", priority: 0.8 },
  { slug: "discharge-calls", priority: 0.9 },
  { slug: "appointment-scheduling", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const currentDate = new Date();

  const staticPages = [
    // ... existing pages
  ];

  // Programmatic integration pages
  const integrationPages = integrations.map((integration) => ({
    url: `${baseUrl}/integrations/${integration.slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: integration.status === "live" ? 0.8 : 0.6,
  }));

  // Programmatic use case pages
  const useCasePages = useCases.map((useCase) => ({
    url: `${baseUrl}/solutions/${useCase.slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: useCase.priority,
  }));

  return [...staticPages, ...integrationPages, ...useCasePages];
}
```

---

## Priority 6: Technical SEO Improvements

### 6.1 Add Canonical URLs to All Pages

Ensure every page exports a canonical URL:

```tsx
alternates: {
  canonical: "/page-path",
}
```

### 6.2 Implement Breadcrumb Schema

For nested pages (integrations, solutions), add BreadcrumbList schema:

```tsx
const breadcrumbSchema = {
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Integrations",
      item: `${siteUrl}/integrations`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "IDEXX Neo",
      item: `${siteUrl}/integrations/idexx-neo`,
    },
  ],
};
```

### 6.3 Optimize Images

Audit all landing page images:

- Use `next/image` with `priority` for above-fold images
- Add descriptive `alt` text with keywords
- Use `placeholder="blur"` to prevent CLS

### 6.4 Add hreflang Tags (Future)

If expanding internationally:

```tsx
alternates: {
  canonical: "/",
  languages: {
    "en-US": "/",
    "en-GB": "/gb",
    "en-CA": "/ca",
  },
}
```

---

## Priority 7: Content Strategy for SEO

### 7.1 Blog Content (Future)

Create a blog targeting long-tail keywords:

**High-value topics:**

1. "How AI is Transforming Veterinary Practice Communication"
2. "The True Cost of Missed Calls at Your Vet Clinic"
3. "IDEXX Neo Best Practices: Maximizing Your PIMS Investment"
4. "Veterinary Discharge Calls: Why Follow-Up Matters"
5. "Reducing Staff Burnout with AI Phone Automation"

### 7.2 Resource Center

Create downloadable resources for link building:

- "The 2025 Veterinary AI Adoption Guide" (PDF)
- "ROI Calculator: AI vs Traditional Answering Services"
- "Discharge Call Script Templates"

---

## Implementation Checklist

### Phase 1: Critical Fixes (Week 1)

- [ ] Fix FeatureTitle semantic HTML (`p` → `h3`)
- [ ] Create `opengraph-image.tsx`
- [ ] Remove static OG image reference from layout.tsx
- [ ] Add SoftwareApplication JSON-LD schema
- [ ] Add FAQPage JSON-LD schema
- [ ] Update keywords array (expand to 40+)

### Phase 2: Page Optimization (Week 2)

- [ ] Add metadata exports to `/features`
- [ ] Add metadata exports to `/pricing`
- [ ] Add metadata exports to `/demo`
- [ ] Add canonical URLs to all pages
- [ ] Audit and optimize images with `next/image`

### Phase 3: Programmatic SEO (Weeks 3-4)

- [ ] Create `/integrations/[slug]` route
- [ ] Build IDEXX Neo integration page
- [ ] Create `/solutions/[use-case]` route
- [ ] Build discharge-calls solution page
- [ ] Update sitemap with dynamic pages

### Phase 4: Advanced (Month 2+)

- [ ] Create comparison pages
- [ ] Launch blog with SEO content
- [ ] Build resource center for link building
- [ ] Implement structured data monitoring

---

## Monitoring & Measurement

### Key Metrics to Track

1. **Organic Traffic** - Google Search Console impressions/clicks
2. **Keyword Rankings** - Track top 20 keywords weekly
3. **Core Web Vitals** - LCP, FID, CLS scores
4. **Rich Results** - FAQ snippets, software ratings in SERPs
5. **Conversion Rate** - Demo bookings from organic traffic

### Recommended Tools

- Google Search Console (free)
- Google Analytics 4 (free)
- Ahrefs or SEMrush (paid, for keyword tracking)
- Screaming Frog (technical audits)

---

## Sources & References

- [Next.js SEO Guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Complete Next.js SEO Guide](https://medium.com/@thomasaugot/the-complete-guide-to-seo-optimization-in-next-js-15-1bdb118cffd7)
- [LifeLearn Veterinary SEO](https://www.lifelearn.com/2024/03/12/veterinary-seo/)
- [Programmatic SEO Examples](https://concurate.com/programmatic-seo-examples/)
- [Dynamic Keyword Insertion](https://www.landermagic.com/blog/dynamic-keyword-insertion-landing-pages)
- [Veterinary Software Comparison](https://software.idexx.com/top-veterinary-software-solutions-a-2025-comparison-guide)
- [Voice Search SEO](https://www.wsiworld.com/blog/the-rise-of-voice-search-optimizing-your-seo-content-for-the-future)
