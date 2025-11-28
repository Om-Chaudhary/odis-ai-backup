# Cases Tab Testing

Complete testing guide for the Cases tab.

## Cases Tab Header

### Test Header Section

- Document:
  - Title "All Cases" and subtitle
  - View toggle buttons (Grid/List icons)
  - "New Case" button
  - Alignment and spacing
  - Responsive layout

## View Mode Toggle

### Test Grid View

- Click grid icon
- Document:
  - Cards display in grid layout
  - Grid columns (should be 3 on large screens)
  - Card sizing and spacing
  - Are all cards the same height?
  - Hover effects
  - Card content display

### Test List View

- Click list icon
- Document:
  - Cases display in list layout
  - List item height consistency
  - Spacing between items
  - Content truncation (if any)
  - Scroll behavior
  - Comparison to grid view layout

### Test View Persistence

- Switch to list view
- Navigate away and back
- Document:
  - Does view mode persist (localStorage)?
  - Does it restore correctly?

## Quick Filters Section

### Test Quick Filter Buttons

- Test each quick filter:
  - "Missing Discharge" (AlertCircle icon)
  - "Missing SOAP" (FileText icon)
  - "Today" (Calendar icon)
  - "This Week" (Calendar icon)
  - "Recent" (Clock icon)
- Document:
  - Button styling when active/inactive
  - Multiple selection capability
  - Tooltip display on hover
  - Icon visibility
  - Filter application (does data update?)
  - URL parameter persistence (`?quickFilters=missingDischarge,today`)
  - Active state styling
  - Responsive layout

## Search and Filter Controls

### Test Search Input

- Type in search box
- Document:
  - Placeholder text ("Search by patient or owner name...")
  - Search icon positioning
  - Real-time filtering
  - Input styling and focus states
  - Clear functionality

### Test Status Filter

- Select each status option:
  - "All"
  - "Draft"
  - "Ongoing"
  - "Completed"
  - "Reviewed"
- Document:
  - FilterButtonGroup styling
  - Active state indication
  - Filter application
  - URL persistence (`?status=draft`)
  - Label "Status" display

### Test Source Filter

- Select each source option:
  - "All"
  - "Manual"
  - "IDEXX Neo"
  - "Cornerstone"
  - "ezyVet"
  - "AVImark"
- Document:
  - FilterButtonGroup styling
  - Active state indication
  - Filter application
  - URL persistence (`?source=idexx_neo`)
  - Label "Source" display

### Test Date Filter

- Use DateFilterButtonGroup in Cases tab
- Document:
  - Same as main date filter testing
  - Does it work with other filters?
  - Filter combination behavior

## Case Cards/List Items

### Test Case Card Display (Grid View)

- Document for each card:
  - Patient name display
  - Owner name display
  - Status badge styling
  - Source indicator
  - Completion indicator
  - Quick actions menu
  - Hover effects
  - Click action (navigates to detail)
  - Loading states
  - Card height consistency
  - Content overflow handling

### Test Case List Item Display (List View)

- Document for each item:
  - Compact layout
  - Information density
  - Status indicators
  - Click action
  - Hover states
  - Height consistency

## Pagination

### Test Pagination Controls

- Navigate through pages
- Document:
  - "Showing X to Y of Z cases" text
  - Previous/Next buttons
  - Disabled states (first/last page)
  - Page reset when filters change
  - URL parameter (`?page=2`)
  - Button styling
  - Responsive layout

## Empty States

### Test Empty State

- Apply filters that return no results
- Document:
  - "No cases found" message
  - Helpful text ("Try adjusting your filters...")
  - Empty state styling
  - Centering and spacing

## Loading States

### Test Loading States

- Refresh page or change filters
- Document:
  - Skeleton loaders (grid view)
  - Skeleton loaders (list view)
  - Animation smoothness
  - Skeleton count
