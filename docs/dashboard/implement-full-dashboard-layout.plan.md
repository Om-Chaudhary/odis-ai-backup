# Implement Full Dashboard Layout

The goal is to implement a professional, responsive dashboard layout using Shadcn UI's `Sidebar` component, providing a persistent navigation structure for the application.

## 1. Create App Sidebar (`src/components/dashboard/app-sidebar.tsx`)

- Implement `AppSidebar` component using `src/components/ui/sidebar.tsx`.
- **Header**: Odis AI Logo/Brand.
- **Content**:
  - **Main Menu**:
    - Dashboard (Home icon) -> `/dashboard`
    - Discharges (Phone/Activity icon) -> `/dashboard/cases`
    - Patients (Users icon) -> `/dashboard/patients` (Placeholder)
    - Schedule (Calendar icon) -> `/dashboard/schedule` (Placeholder)
  - **Secondary/System**:
    - Settings (Settings icon)
    - Help/Support (CircleHelp icon)
- **Footer**: User profile menu (Avatar, Name, Email) with Sign Out option.

## 2. Create Dashboard Layout Wrapper (`src/app/dashboard/layout.tsx`)

- Replace existing layout.
- Wrap content in `SidebarProvider`.
- Render `AppSidebar`.
- Render `SidebarInset`:
  - **Header**: Sticky top bar with `SidebarTrigger`, Separator, and Breadcrumbs.
  - **Main Content**: `{children}` wrapped in a container.

## 3. Layout Adjustments

- Ensure the background gradients/effects from the previous layout are preserved or adapted to the `SidebarInset` background to maintain visual consistency.

## Verification

- Verify the sidebar renders correctly on desktop and collapses on mobile.
- Verify navigation links work.
- Verify the layout is responsive.
