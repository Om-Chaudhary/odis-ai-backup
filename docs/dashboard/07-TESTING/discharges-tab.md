# Discharges Tab Testing

Complete testing guide for the Discharges tab.

## Discharges Tab Header

### Test Header Section

- Document:
  - Title "Discharge Management" and subtitle
  - Test Mode badge (if active)
  - Refresh button (with loading spinner)
  - Settings button
  - Alignment and spacing
  - Responsive layout

## Search Filter

### Test Search Input

- Type in search box
- Document:
  - Placeholder ("Search patients or owners...")
  - Search icon positioning
  - Real-time filtering
  - Input styling

## Day Pagination Controls

### Test Day Navigation

- Click previous/next day buttons
- Document:
  - Date display format
  - Total items count display
  - Button functionality
  - Date change updates case list
  - Current date highlighting
  - Button disabled states (if any)

## Date Filter

### Test Date Filter in Discharges Tab

- Use DateFilterButtonGroup
- Document:
  - Filter interaction with day navigation
  - Does date filter override day navigation?
  - Filter persistence
  - Combined behavior

## Status Summary Bar

### Test Status Summary

- Document:
  - Total cases count
  - Ready cases count and button
  - Pending cases count and button
  - Completed cases count and button
  - Failed cases count and button
  - Scheduled calls count
  - Scheduled emails count
  - Active filter highlighting
  - Click actions (filter application)
  - Bar styling and spacing
  - Responsive layout

### Test Status Filtering

- Click each status in summary bar:
  - "All"
  - "Ready"
  - "Pending"
  - "Completed"
  - "Failed"
- Document:
  - Filter application
  - Active state indication
  - Case list updates
  - Count accuracy

## Case Cards

### Test Discharge Case Cards

- Document for each card:
  - Patient information display
  - Owner information display
  - Contact indicators (phone/email icons)
  - Discharge status indicators
  - "Trigger Call" button
  - "Trigger Email" button
  - Loading states on buttons
  - Edit patient info functionality
  - Test mode indicators (if active)
  - Card styling and hover effects
  - Card height consistency
  - Grid layout (3 columns on large screens)

## Empty State

### Test Empty State

- Navigate to date with no cases
- Document:
  - Empty state message
  - Empty state styling
  - Centering

## Loading States

### Test Loading States

- Document:
  - Skeleton loaders
  - Refresh button spinner
  - Button loading states during actions
