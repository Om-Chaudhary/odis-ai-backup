# Data Views Documentation

> **Purpose:** Beautiful, non-tabular views for medical records and data  
> **Last Updated:** 2025-11-28

## 📚 Available Data Views

### SOAP Notes

- **[SOAP Note Viewer](../03-COMPONENTS/soap-note-viewer.md)** - Beautiful, structured SOAP note display
  - Color-coded sections (Subjective, Objective, Assessment, Plan)
  - Expandable/collapsible sections
  - Proper text formatting
  - Print, copy, and export functionality

### Discharge Summaries

- **[Discharge Summary Viewer](../03-COMPONENTS/discharge-summary-viewer.md)** - Document-style discharge summary display
  - Structured sections with headers
  - Highlighted medications in badges
  - Warning signs in colored callout boxes
  - Formatted instruction lists
  - Search functionality

### Transcripts

- **[Transcript Viewer](../03-COMPONENTS/transcript-viewer.md)** - Conversation-style transcript display
  - Conversation-style bubbles
  - Speaker identification with avatars
  - Timestamps for each message
  - Search with highlights
  - Export to text/PDF

## 🎨 Design Philosophy

All data views follow these principles:

1. **Non-Tabular** - Not Excel-style tables
   - Focus on readability over data density
   - Visual hierarchy guides the eye
   - Content-first design

2. **Visual Hierarchy** - Clear structure and organization
   - Section headers with icons
   - Color coding for different content types
   - Proper spacing and typography

3. **Readable** - Optimized for reading, not data entry
   - Proper text formatting (line breaks, paragraphs)
   - Adequate font sizes and line heights
   - High contrast for accessibility

4. **Interactive** - Expandable sections, search, actions
   - Collapsible sections for long content
   - Search functionality for finding specific content
   - Action buttons (copy, print, export)

5. **Consistent** - Follow dashboard design system
   - Use design system colors and spacing
   - Consistent component patterns
   - Shared container component

## 📐 Common Patterns

### Container Component

All data views use the `DataViewContainer` component for consistent layout:

```typescript
<DataViewContainer
  title="SOAP Note #1"
  subtitle="Created: November 26, 2025"
  backButton={{
    label: "Back to Cases",
    href: "/dashboard?tab=cases"
  }}
  actions={
    <>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Print</Button>
      <Button variant="outline">Export</Button>
    </>
  }
>
  {/* View content */}
</DataViewContainer>
```

### Action Buttons

Standard action buttons available in all views:

- **Copy** - Copy content to clipboard
- **Print** - Print-friendly view
- **Export** - Export to PDF/text
- **Search** - Search within content (where applicable)

### Responsive Behavior

- **Desktop:** Full-width container with side-by-side actions
- **Tablet:** Full-width container with stacked actions
- **Mobile:** Full-width container with compact actions

## 🔧 Implementation Guidelines

### Text Formatting

Preserve formatting from source data:

```typescript
<div className="whitespace-pre-wrap text-slate-700">
  {content}
</div>
```

### Section Headers

Use consistent section header styling:

```typescript
<div className="mb-4 flex items-center gap-2">
  <Icon className="h-5 w-5 text-[#31aba3]" />
  <h3 className="text-lg font-semibold">{sectionTitle}</h3>
</div>
```

### Color Coding

Use design system colors for sections:

- **Subjective:** Blue (`bg-blue-50`, `border-blue-200`)
- **Objective:** Teal (`bg-teal-50`, `border-teal-200`)
- **Assessment:** Purple (`bg-purple-50`, `border-purple-200`)
- **Plan:** Emerald (`bg-emerald-50`, `border-emerald-200`)

### Expandable Sections

Use Collapsible component for long content:

```typescript
<Collapsible>
  <CollapsibleTrigger>
    <ChevronDown className="h-4 w-4" />
    {sectionTitle}
  </CollapsibleTrigger>
  <CollapsibleContent>
    {sectionContent}
  </CollapsibleContent>
</Collapsible>
```

## 📱 Accessibility

All data views should:

1. **Keyboard Navigation** - All interactive elements keyboard accessible
2. **Screen Reader Support** - Proper ARIA labels and roles
3. **High Contrast** - Meet WCAG AA contrast requirements
4. **Focus Indicators** - Clear focus states for keyboard users
5. **Semantic HTML** - Proper heading hierarchy and landmarks

## 🚀 Performance

Optimize data views for performance:

1. **Lazy Loading** - Load content on demand
2. **Virtual Scrolling** - For long transcripts (future)
3. **Memoization** - Memoize parsed content
4. **Code Splitting** - Lazy load viewer components

## 🔗 Related Documentation

- [Component Documentation](../03-COMPONENTS/) - Individual viewer components
- [Design System](../01-GENERAL/design-system.md) - Design system reference
- [Data View Container](../03-COMPONENTS/data-view-container.md) - Shared container component
- [Patterns](../04-PATTERNS/) - Design patterns for data views

---

**Last Updated:** 2025-11-28  
**Status:** Documentation complete
