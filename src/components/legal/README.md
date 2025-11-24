# Legal Components

Reusable components for creating accessible, compliant legal documents.

## ComplianceDocument Component

A fully accessible, production-ready component for displaying legal documents such as Privacy Policies, Terms of Service, and Cookie Policies.

### Features

- ✅ **WCAG 2.1 AA Compliant**: Proper semantic HTML, ARIA labels, keyboard navigation
- ✅ **Interactive Table of Contents**: Auto-generated with smooth scrolling anchor links
- ✅ **Mobile Responsive**: Optimized for all screen sizes
- ✅ **Print Friendly**: Dedicated print styles for clean paper output
- ✅ **Skip to Content**: Accessibility link for keyboard users
- ✅ **Back to Top Button**: Appears after scrolling down
- ✅ **SEO Optimized**: Proper heading hierarchy and structure

### Quick Start

```typescript
import { ComplianceDocument } from "~/components/legal/compliance-document";
import type { ComplianceSection } from "~/components/legal/compliance-document";

const sections: ComplianceSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: <p>Your content here...</p>,
  },
  {
    id: "section-with-subsections",
    title: "Main Section",
    content: <p>Main section content...</p>,
    subsections: [
      {
        id: "subsection-1",
        title: "Subsection Title",
        content: <p>Subsection content...</p>,
      },
    ],
  },
];

export default function MyCompliancePage() {
  return (
    <ComplianceDocument
      title="Privacy Policy"
      lastUpdated="January 15, 2025"
      effectiveDate="January 1, 2025"
      sections={sections}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Document title displayed as h1 |
| `lastUpdated` | `string` | Yes | Last updated date (formatted string) |
| `effectiveDate` | `string` | No | Effective date (formatted string) |
| `sections` | `ComplianceSection[]` | Yes | Array of content sections |
| `className` | `string` | No | Additional CSS classes |

### Section Structure

```typescript
interface ComplianceSection {
  id: string;                  // Unique ID for anchor links (kebab-case)
  title: string;               // Section heading
  content: React.ReactNode;    // Main content (JSX)
  subsections?: ComplianceSection[]; // Optional nested sections
}
```

### Content Formatting

Use semantic HTML and JSX:

```typescript
{
  id: "data-collection",
  title: "Data We Collect",
  content: (
    <>
      <p>We collect the following information:</p>
      <ul>
        <li><strong>Personal Information:</strong> Name, email, etc.</li>
        <li><strong>Usage Data:</strong> IP address, browser type, etc.</li>
      </ul>
      <p>
        For more details, see our{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </>
  ),
}
```

### Accessibility Features

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Skip to content link (appears on focus)
   - Focus indicators on all buttons and links

2. **Screen Reader Support**
   - Semantic HTML (nav, main, section, header)
   - ARIA landmarks and labels
   - Proper heading hierarchy (h1 → h2 → h3)

3. **Visual Accessibility**
   - Minimum 16px base font size
   - 4.5:1 color contrast ratio
   - Clear visual hierarchy

### Print Functionality

The component includes dedicated print styles:
- Optimized typography for paper
- Removed interactive elements
- Clean black and white design
- Proper page breaks

Users can print via browser (Cmd/Ctrl + P).

### Example Pages

See complete examples:
- `/src/app/privacy-policy/` - Privacy Policy
- `/src/app/terms-of-service/` - Terms of Service

### Customization

#### Change Styling

Edit Tailwind classes in the component:

```typescript
// Example: Change heading color
<h1 className="mb-4 text-4xl font-bold text-blue-900">
  {title}
</h1>
```

#### Add Custom Sections

Simply add objects to your sections array:

```typescript
const sections: ComplianceSection[] = [
  // ... existing sections
  {
    id: "custom-section",
    title: "Custom Section",
    content: <p>Your custom content...</p>,
  },
];
```

#### Modify Table of Contents

The TOC is auto-generated from sections. To customize appearance, edit the `nav` element in the component.

### Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

### Performance

- Minimal JavaScript (client-side only for scroll tracking)
- CSS-in-JS only for print styles
- No external dependencies beyond UI components
- Fast initial page load

### Best Practices

1. **Keep sections focused**: One topic per section
2. **Use semantic HTML**: Proper lists, paragraphs, headings
3. **Link related content**: Cross-link to other policies
4. **Update dates**: Always update lastUpdated when changing content
5. **Test accessibility**: Verify with keyboard and screen reader
6. **Legal review**: Have legal counsel review content

### Common Issues

**Q: Table of contents links don't work**
- Ensure each section has a unique `id`
- IDs should be kebab-case (e.g., "data-collection")

**Q: Content overlaps with header**
- The component includes scroll-mt-20 for proper scroll positioning
- Adjust the `yOffset` value in the scrollToSection function if needed

**Q: Print styles not working**
- Ensure you're not overriding print styles elsewhere
- Test in different browsers (print preview behavior varies)

**Q: Accessibility warnings**
- Check heading hierarchy (should go h1 → h2 → h3, no skipping)
- Ensure all interactive elements have proper labels
- Verify color contrast meets 4.5:1 ratio

### Related Documentation

- [Full Customization Guide](/COMPLIANCE_PAGES_GUIDE.md)
- [Next.js App Router](https://nextjs.org/docs/app)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### License

Part of the Odis AI project. See main project license.
