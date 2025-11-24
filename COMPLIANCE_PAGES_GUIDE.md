# Compliance Pages Guide

This guide explains how to use and customize the reusable compliance document system for creating legal pages like Privacy Policy, Terms of Service, and Cookie Policy.

## Overview

The compliance pages system consists of:

1. **ComplianceDocument Component** - A reusable, accessible component for displaying legal documents
2. **Content Modules** - Separate files containing the actual content for each document
3. **Page Components** - Next.js pages that combine the component with content

## File Structure

```
src/
├── components/
│   └── legal/
│       └── compliance-document.tsx    # Reusable component
└── app/
    ├── privacy-policy/
    │   ├── content.tsx                # Privacy policy content
    │   └── page.tsx                   # Privacy policy page
    ├── terms-of-service/
    │   ├── content.tsx                # Terms of service content
    │   └── page.tsx                   # Terms of service page
    └── cookie-policy/
        ├── content.tsx                # Cookie policy content (create as needed)
        └── page.tsx                   # Cookie policy page (create as needed)
```

## Features

### Accessibility (WCAG 2.1 AA Compliant)

- ✅ Semantic HTML structure with proper heading hierarchy (h1 → h2 → h3)
- ✅ Skip to content link for keyboard navigation
- ✅ Focus indicators on all interactive elements
- ✅ ARIA landmarks and labels
- ✅ Sufficient color contrast (4.5:1 minimum)
- ✅ Readable font sizes (minimum 16px)
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

### User Experience

- ✅ Interactive table of contents with anchor links
- ✅ Back to top button (appears when scrolling)
- ✅ Mobile responsive design
- ✅ Print-friendly styles
- ✅ Smooth scrolling
- ✅ Clear visual hierarchy

### SEO & Metadata

- ✅ Proper Next.js metadata configuration
- ✅ OpenGraph tags
- ✅ Twitter cards
- ✅ Canonical URLs
- ✅ Robots meta tags

## Customization Guide

### Step 1: Update Company Information

In each `content.tsx` file, update the constants at the top:

```typescript
// src/app/privacy-policy/content.tsx

export const COMPANY_NAME = "Your Company Name";
export const CONTACT_EMAIL = "privacy@yourcompany.com";
export const COMPANY_ADDRESS = "123 Business Street, City, State 12345";
export const LAST_UPDATED = "January 15, 2025";
export const EFFECTIVE_DATE = "January 1, 2025";
```

### Step 2: Search and Replace

Use your editor's find-and-replace functionality:

1. Find: `COMPANY_NAME`
2. Replace with: Your actual company name
3. Search in: All files in `src/app/privacy-policy/`, `src/app/terms-of-service/`, etc.

### Step 3: Review TODO Comments

Each content file contains TODO comments highlighting sections that need customization:

```typescript
// TODO: Update contact information in the Contact section
// TODO: Customize sections based on your specific data practices
// TODO: Review and update third-party services list
// TODO: Add any additional sections specific to your business
```

Search for `TODO:` in your content files and address each one.

### Step 4: Customize Content Sections

The content is structured as an array of `ComplianceSection` objects:

```typescript
export const privacyPolicySections: ComplianceSection[] = [
  {
    id: "section-id",          // Used for anchor links
    title: "Section Title",     // Displayed heading
    content: (                  // Main content (JSX)
      <>
        <p>Your content here...</p>
      </>
    ),
    subsections: [              // Optional nested sections
      {
        id: "subsection-id",
        title: "Subsection Title",
        content: <p>Subsection content...</p>
      }
    ]
  },
  // ... more sections
];
```

#### Adding a New Section

```typescript
{
  id: "new-section",
  title: "New Section Title",
  content: (
    <>
      <p>Your content here.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    </>
  ),
}
```

#### Removing a Section

Simply delete the section object from the array.

#### Reordering Sections

Change the order of objects in the array. The table of contents will update automatically.

### Step 5: Update Metadata

In each `page.tsx` file, customize the metadata:

```typescript
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Your custom description...",
  // ... other metadata
};
```

## Creating a New Compliance Page

To create a new compliance page (e.g., Cookie Policy):

### 1. Create Content File

```typescript
// src/app/cookie-policy/content.tsx

import type { ComplianceSection } from "~/components/legal/compliance-document";

export const COMPANY_NAME = "Your Company";
export const LAST_UPDATED = "January 1, 2025";
export const EFFECTIVE_DATE = "January 1, 2025";

export const cookiePolicySections: ComplianceSection[] = [
  {
    id: "what-are-cookies",
    title: "What Are Cookies?",
    content: (
      <>
        <p>Cookies are small text files...</p>
      </>
    ),
  },
  // ... more sections
];
```

### 2. Create Page File

```typescript
// src/app/cookie-policy/page.tsx

import type { Metadata } from "next";
import { ComplianceDocument } from "~/components/legal/compliance-document";
import {
  cookiePolicySections,
  COMPANY_NAME,
  LAST_UPDATED,
  EFFECTIVE_DATE,
} from "./content";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `Learn about how ${COMPANY_NAME} uses cookies...`,
  // ... other metadata
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <a
              href="/"
              className="text-lg font-semibold text-slate-900 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ← Back to Home
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ComplianceDocument
          title="Cookie Policy"
          lastUpdated={LAST_UPDATED}
          effectiveDate={EFFECTIVE_DATE}
          sections={cookiePolicySections}
        />
      </div>

      <footer className="border-t bg-slate-50 py-12 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-slate-600">
            <p>
              © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center gap-6">
              <a href="/privacy-policy" className="hover:text-primary">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="hover:text-primary">
                Terms of Service
              </a>
              <a href="/cookie-policy" className="hover:text-primary">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

## Component Props

### ComplianceDocument

```typescript
interface ComplianceDocumentProps {
  title: string;              // Document title (e.g., "Privacy Policy")
  lastUpdated: string;        // Last updated date
  effectiveDate?: string;     // Optional effective date
  sections: ComplianceSection[]; // Array of content sections
  className?: string;         // Optional additional CSS classes
}
```

### ComplianceSection

```typescript
interface ComplianceSection {
  id: string;                  // Unique identifier for anchor links
  title: string;               // Section heading
  content: React.ReactNode;    // Section content (JSX)
  subsections?: ComplianceSection[]; // Optional nested sections
}
```

## Styling Customization

The component uses Tailwind CSS classes. To customize styling:

### Global Styles

Edit the Tailwind classes directly in the component:

```typescript
// src/components/legal/compliance-document.tsx

// Example: Change heading color
<h1 className="mb-4 text-4xl font-bold tracking-tight text-blue-900">
```

### Print Styles

Print-specific styles are included inline:

```typescript
<style jsx global>{`
  @media print {
    // Custom print styles
  }
`}</style>
```

### Typography

The component uses prose classes from Tailwind Typography:

```typescript
<div className="prose prose-slate max-w-none text-base leading-relaxed">
  {section.content}
</div>
```

## Legal Compliance Checklist

Before publishing your compliance pages:

- [ ] Replace all "COMPANY_NAME" placeholders
- [ ] Update all contact information (email, address, phone)
- [ ] Review all TODO comments and address them
- [ ] Customize content to match your actual data practices
- [ ] Update third-party services list
- [ ] Verify GDPR/CCPA sections match your requirements
- [ ] Set correct effective dates and last updated dates
- [ ] Update governing law jurisdiction (Terms of Service)
- [ ] **Consult with legal counsel before publishing**
- [ ] Add links to compliance pages in your site footer
- [ ] Test accessibility with screen reader
- [ ] Verify mobile responsiveness
- [ ] Test print functionality
- [ ] Check all anchor links work correctly

## Maintenance

### Updating Content

1. Edit the relevant `content.tsx` file
2. Update the `LAST_UPDATED` constant
3. If changes are material, update `EFFECTIVE_DATE`
4. Consider notifying users of significant changes

### Version Control

Consider keeping old versions of your compliance documents:

```typescript
// src/app/privacy-policy/versions/2025-01-01.tsx
export const privacyPolicySections_2025_01_01: ComplianceSection[] = [
  // Old version content
];
```

## Accessibility Testing

Test your compliance pages with:

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Readers**: Test with NVDA, JAWS, or VoiceOver
3. **Color Contrast**: Use tools like WebAIM Contrast Checker
4. **Mobile**: Test on various screen sizes
5. **Print**: Verify print layout looks good

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GDPR Compliance](https://gdpr.eu/)
- [CCPA Compliance](https://oag.ca.gov/privacy/ccpa)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

## Support

For issues or questions about the compliance pages system:

1. Check this documentation
2. Review TODO comments in content files
3. Consult with legal counsel for legal questions
4. Contact your development team for technical issues

---

**Important**: This system provides a technical framework for compliance pages. The actual legal content should be reviewed and approved by qualified legal counsel before publication.
