# Sidebar Navigation Testing

Complete testing guide for sidebar navigation and main dashboard page elements.

## Sidebar Expansion/Collapse States

### Test with Sidebar EXPANDED

- Navigate to `/dashboard`
- Click sidebar toggle/collapse button (if available)
- Document:
  - Does sidebar collapse smoothly?
  - Are icon-only versions visible when collapsed?
  - Does main content area resize appropriately?
  - Are tooltips shown on hover when collapsed?
  - Do all sidebar menu items remain accessible?

### Test with Sidebar COLLAPSED

- Start with collapsed sidebar
- Navigate to `/dashboard`
- Document:
  - Card heights in Overview section (are they equal?)
  - Spacing between cards
  - Content alignment
  - Grid layouts (do they maintain proper columns?)
  - Any overflow or truncation issues
  - Compare card heights to expanded sidebar state

### Test Sidebar Menu Items

- Click each menu item:
  - "Dashboard" → `/dashboard`
  - "Discharges" → `/dashboard/cases`
  - "Settings" → `/dashboard/settings`
- Document:
  - Are active states correct?
  - Are icons visible and properly sized?
  - Do tooltips work correctly?
  - Is user profile visible in footer?

## Main Dashboard Page

### Profile Header Section

**Test Profile Header:**

- Document:
  - Avatar display (with/without image)
  - Name display format
  - Clinic name display
  - Email display
  - Role badge (Veterinarian) styling
  - Responsive behavior on mobile
  - Spacing and alignment

**Test Sign Out Button:**

- Click "Sign Out" button
- Document:
  - Does it appear in correct location?
  - Is styling consistent?
  - Does it work correctly?

### Tab Navigation (`DashboardNavigation`)

**Test Tab Switching:**

- Click each tab:
  - "Overview" (BarChart3 icon)
  - "Cases" (FolderOpen icon)
  - "Discharges" (Phone icon)
- Document:
  - Are active states visually clear?
  - Do tabs maintain state in URL (`?tab=overview`)?
  - Do icons display correctly?
  - Are labels visible on all screen sizes?
  - Does tab content load correctly?
  - Are animations smooth?

### Date Range Filter (`DateRangePresets`)

**Test Date Filter Buttons:**

- Click each preset:
  - "All Time"
  - "Day" (1d)
  - "3D" (3d)
  - "30D" (30d)
- Document:
  - Are active states clear?
  - Do filters persist in URL (`?dateRange=all`)?
  - Do filters work correctly across all tabs?
  - Are button sizes consistent?
  - Is the filter group properly positioned?
  - Responsive layout on mobile
