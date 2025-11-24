# Compliance Pages - File Structure & Routes

Visual reference for the compliance pages implementation.

## Directory Structure

```
/Users/s0381806/Development/odis-ai-web/
│
├── src/
│   ├── components/
│   │   ├── legal/
│   │   │   ├── compliance-document.tsx      ← Reusable Component
│   │   │   └── README.md                    ← Component Documentation
│   │   │
│   │   └── Footer.tsx                       ← Updated with new links
│   │
│   └── app/
│       ├── privacy-policy/
│       │   ├── content.tsx                  ← Privacy Policy Content
│       │   └── page.tsx                     ← Privacy Policy Page
│       │                                       Route: /privacy-policy
│       │
│       ├── terms-of-service/
│       │   ├── content.tsx                  ← Terms of Service Content
│       │   └── page.tsx                     ← Terms of Service Page
│       │                                       Route: /terms-of-service
│       │
│       └── cookie-policy/                   ← Create when needed
│           ├── content.tsx
│           └── page.tsx
│                                               Route: /cookie-policy
│
├── QUICK_START_COMPLIANCE.md               ← Quick Start Guide (15 min)
├── IMPLEMENTATION_SUMMARY.md               ← Full Implementation Details
├── COMPLIANCE_PAGES_GUIDE.md               ← Comprehensive Customization Guide
└── COMPLIANCE_PAGES_STRUCTURE.md           ← This file (Visual Reference)
```

## Routes

### Live URLs (after deployment)

```
https://yourdomain.com/privacy-policy
https://yourdomain.com/terms-of-service
https://yourdomain.com/cookie-policy
```

### Development URLs

```
http://localhost:3000/privacy-policy
http://localhost:3000/terms-of-service
http://localhost:3000/cookie-policy
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ComplianceDocument                       │
│                  (Reusable Component)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Skip to Content Link (Accessibility)             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Header                                            │     │
│  │  - Document Title (h1)                             │     │
│  │  - Effective Date                                  │     │
│  │  - Last Updated                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Table of Contents                                 │     │
│  │  - Auto-generated from sections                    │     │
│  │  - Smooth scroll anchor links                      │     │
│  │  - Keyboard accessible                             │     │
│  │  - Shows main sections and subsections             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Main Content                                      │     │
│  │                                                     │     │
│  │  Section 1                                         │     │
│  │  ├─ Subsection 1.1                                 │     │
│  │  └─ Subsection 1.2                                 │     │
│  │                                                     │     │
│  │  Section 2                                         │     │
│  │  ├─ Subsection 2.1                                 │     │
│  │  └─ Subsection 2.2                                 │     │
│  │                                                     │     │
│  │  Section 3...                                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Back to Top Button (Fixed Position)              │     │
│  │  - Appears after scrolling 400px                   │     │
│  │  - Smooth scroll to top                            │     │
│  │  - Keyboard accessible                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────┐
│   content.tsx           │
│   (Content Module)      │
│                         │
│   - COMPANY_NAME        │
│   - CONTACT_EMAIL       │
│   - LAST_UPDATED        │
│   - sections[]          │
└───────────┬─────────────┘
            │
            │ import
            ▼
┌─────────────────────────┐
│   page.tsx              │
│   (Next.js Page)        │
│                         │
│   - metadata            │
│   - page layout         │
│   - ComplianceDocument  │
└───────────┬─────────────┘
            │
            │ renders
            ▼
┌─────────────────────────┐
│   compliance-document   │
│   (Reusable Component)  │
│                         │
│   - Props               │
│   - Rendering logic     │
│   - Accessibility       │
└─────────────────────────┘
```

## Content Structure

```
ComplianceSection[]
│
├── Section 1
│   ├── id: "introduction"
│   ├── title: "Introduction"
│   ├── content: <JSX>
│   └── subsections: []
│
├── Section 2
│   ├── id: "information-collection"
│   ├── title: "Information We Collect"
│   ├── content: <JSX>
│   └── subsections:
│       ├── Subsection 2.1
│       │   ├── id: "personal-information"
│       │   ├── title: "Personal Information"
│       │   └── content: <JSX>
│       │
│       ├── Subsection 2.2
│       │   ├── id: "usage-information"
│       │   ├── title: "Usage Information"
│       │   └── content: <JSX>
│       │
│       └── Subsection 2.3
│           ├── id: "extension-data"
│           ├── title: "Chrome Extension Data"
│           └── content: <JSX>
│
└── Section 3...
```

## Page Layout

```
┌──────────────────────────────────────────────────┐
│                    Header                         │
│  ┌──────────────────────────────────────┐        │
│  │  ← Back to Home                      │        │
│  └──────────────────────────────────────┘        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              Main Content Area                    │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │                                             │  │
│  │      ComplianceDocument Component           │  │
│  │                                             │  │
│  │  - Title                                    │  │
│  │  - Dates                                    │  │
│  │  - Table of Contents                        │  │
│  │  - Sections                                 │  │
│  │                                             │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│                    Footer                         │
│                                                   │
│  © 2025 Company Name. All rights reserved.       │
│                                                   │
│  Privacy Policy | Terms of Service | Cookies     │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```
Mobile (< 640px)
├── Single column layout
├── Touch-optimized spacing
├── Collapsible sections
└── Full-width content

Tablet (640px - 1024px)
├── Optimized column width
├── Larger touch targets
├── Enhanced readability
└── Balanced white space

Desktop (> 1024px)
├── Max-width container (4xl)
├── Optimal reading line length
├── Enhanced table of contents
└── Back to top button
```

## Accessibility Tree

```
Document
├── Skip Link (sr-only, visible on focus)
├── Header (landmark)
│   └── Navigation
│       └── Link: Back to Home
├── Main (landmark, tabindex=-1)
│   ├── Heading 1: Document Title
│   ├── Metadata: Dates
│   ├── Navigation (Table of Contents)
│   │   ├── Heading 2: Table of Contents
│   │   └── Ordered List
│   │       ├── Button: Section 1 (keyboard accessible)
│   │       ├── Button: Section 2
│   │       └── ...
│   └── Sections
│       ├── Section (landmark)
│       │   ├── Heading 2: Section Title
│       │   ├── Content
│       │   └── Subsections
│       │       ├── Heading 3: Subsection Title
│       │       └── Content
│       └── ...
├── Button: Back to Top (fixed, keyboard accessible)
└── Footer (landmark)
    ├── Copyright
    └── Links: Privacy | Terms | Cookies
```

## TypeScript Types Hierarchy

```
ComplianceDocumentProps
├── title: string
├── lastUpdated: string
├── effectiveDate?: string
├── sections: ComplianceSection[]
└── className?: string

ComplianceSection
├── id: string
├── title: string
├── content: React.ReactNode
└── subsections?: ComplianceSection[]  (recursive)
```

## Customization Points

```
High Priority (Must Update)
├── COMPANY_NAME
├── CONTACT_EMAIL
├── COMPANY_ADDRESS
├── LAST_UPDATED
└── EFFECTIVE_DATE

Medium Priority (Should Update)
├── Third-party services list
├── Data collection practices
├── Security measures
├── Rights and choices sections
└── Governing law jurisdiction

Low Priority (Optional)
├── Styling (Tailwind classes)
├── Print styles
├── Component behavior
└── Additional sections
```

## Dependencies Graph

```
ComplianceDocument Component
│
├── React (hooks: useState, useEffect, useCallback)
├── lucide-react (ArrowUp icon)
├── ~/lib/utils (cn utility)
└── ~/components/ui/button (Button component)

Pages
│
├── next (Metadata type)
├── ComplianceDocument component
└── content module (sections, constants)

Content Modules
│
└── ComplianceSection type
```

## SEO Structure

```
Each Page
│
├── Metadata
│   ├── title
│   ├── description
│   ├── alternates.canonical
│   ├── openGraph
│   │   ├── title
│   │   ├── description
│   │   ├── type
│   │   └── url
│   ├── twitter
│   │   ├── card
│   │   ├── title
│   │   └── description
│   └── robots
│       ├── index: true
│       └── follow: true
│
└── HTML Structure
    ├── Semantic elements
    ├── Proper heading hierarchy
    └── Structured content
```

## Print Layout

```
Printed Page
│
├── Header
│   ├── Document Title (24pt)
│   └── Dates
│
├── Table of Contents
│   └── Section numbers and titles
│       (with underlines for page references)
│
├── Content
│   ├── Section 1 (18pt heading)
│   │   ├── Content (12pt)
│   │   └── Subsections (14pt heading)
│   │
│   ├── Section 2
│   └── ...
│
└── (Back to top button hidden)
└── (Footer modified for print)
```

## State Management

```
Component State
│
├── showBackToTop: boolean
│   └── Updates on scroll (Y > 400px)
│
└── Event Listeners
    ├── window.scroll
    │   └── Updates showBackToTop
    │
    └── Cleanup on unmount
```

## Navigation Flow

```
User Journey
│
├── Landing on page
│   └── Focus: Document title
│
├── Keyboard navigation
│   ├── Skip to content (hidden, shows on Tab)
│   ├── Back to home link
│   ├── Table of contents buttons
│   └── Main content sections
│
├── Mouse/Touch navigation
│   ├── Click TOC links → smooth scroll
│   ├── Scroll down → back to top appears
│   └── Click back to top → smooth scroll up
│
└── Screen reader
    ├── Skip to content option
    ├── Landmarks for navigation
    ├── Proper heading structure
    └── Descriptive link text
```

---

## Quick Reference

| Item            | Location                                       | Purpose                |
| --------------- | ---------------------------------------------- | ---------------------- |
| Component       | `src/components/legal/compliance-document.tsx` | Reusable template      |
| Privacy content | `src/app/privacy-policy/content.tsx`           | Privacy policy text    |
| Privacy page    | `src/app/privacy-policy/page.tsx`              | Privacy route          |
| Terms content   | `src/app/terms-of-service/content.tsx`         | Terms text             |
| Terms page      | `src/app/terms-of-service/page.tsx`            | Terms route            |
| Footer          | `src/components/Footer.tsx`                    | Links to pages         |
| Quick start     | `QUICK_START_COMPLIANCE.md`                    | 15-min setup           |
| Full guide      | `COMPLIANCE_PAGES_GUIDE.md`                    | Comprehensive docs     |
| Summary         | `IMPLEMENTATION_SUMMARY.md`                    | Implementation details |

---

**Visual Reference Complete**: Use this document to understand the structure and relationships of the compliance pages system.
