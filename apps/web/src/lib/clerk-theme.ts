import type { Appearance } from "@clerk/types";

/**
 * Custom Clerk theme matching Odis AI brand
 *
 * Teal color palette with warm accents
 * Applied globally via ClerkProvider in app/layout.tsx
 */
export const clerkAppearance: Appearance = {
  variables: {
    // Primary brand color (teal)
    colorPrimary: "#0f766e", // teal-700
    colorDanger: "#dc2626", // red-600
    colorSuccess: "#059669", // emerald-600
    colorWarning: "#f59e0b", // amber-500

    // Text colors
    colorText: "#1f2937", // gray-800
    colorTextSecondary: "#6b7280", // gray-500
    colorTextOnPrimaryBackground: "#ffffff",

    // Background colors
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1f2937",

    // Borders and shadows
    borderRadius: "0.5rem", // rounded-lg
    colorBorder: "#e5e7eb", // gray-200
    colorShimmer: "#f3f4f6", // gray-100

    // Font
    fontFamily:
      '"Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  elements: {
    // Root container
    rootBox: "mx-auto",
    card: "shadow-lg border border-gray-200 rounded-xl",

    // Form elements
    formButtonPrimary:
      "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors duration-200 shadow-sm",
    formFieldInput:
      "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors rounded-lg",
    formFieldLabel: "text-gray-700 font-medium text-sm",
    formFieldInputShowPasswordButton: "text-gray-500 hover:text-teal-600",

    // Headers
    headerTitle: "text-teal-900 font-bold text-2xl",
    headerSubtitle: "text-gray-600 text-sm",

    // Links and buttons
    footerActionLink: "text-teal-600 hover:text-teal-700 font-medium",
    identityPreviewText: "text-gray-700",
    identityPreviewEditButton: "text-teal-600 hover:text-teal-700",

    // User Button
    userButtonBox: "rounded-lg",
    avatarBox: "rounded-lg",

    // Organization Switcher
    organizationSwitcherTrigger:
      "px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors",
    organizationSwitcherTriggerIcon: "text-teal-600",

    // Modals and dropdowns
    modalContent: "rounded-xl shadow-xl",
    modalBackdrop: "backdrop-blur-sm",

    // Tabs
    tabButton: "text-gray-600 hover:text-teal-700",
    tabButtonActive: "text-teal-700 border-teal-700",

    // Social buttons
    socialButtonsBlockButton:
      "border-gray-300 hover:border-teal-500 hover:bg-teal-50 transition-colors",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",

    // Dividers
    dividerLine: "bg-gray-200",
    dividerText: "text-gray-500 text-xs",

    // Alert/Warning
    alertText: "text-sm",

    // Profile sections
    profileSectionTitleText: "text-gray-900 font-semibold",
    profileSectionContent: "text-gray-700",

    // Badge
    badge:
      "bg-teal-100 text-teal-800 rounded-full px-2 py-0.5 text-xs font-medium",

    // Form field row
    formFieldRow: "gap-4",

    // Navbar
    navbar: "shadow-sm",
    navbarButton: "text-gray-700 hover:text-teal-700",
    navbarButtonIcon: "text-gray-500",

    // Page scrollbox
    pageScrollBox: "px-6 py-8",
  },

  layout: {
    // Add subtle logo/branding
    logoImageUrl: "/icon-128.png",
    shimmer: true,
  },
};

/**
 * Dark mode variant (optional)
 */
export const clerkDarkAppearance: Appearance = {
  baseTheme: undefined, // Can import from @clerk/themes if needed
  variables: {
    colorPrimary: "#14b8a6", // teal-500
    colorBackground: "#111827", // gray-900
    colorInputBackground: "#1f2937", // gray-800
    colorText: "#f9fafb", // gray-50
    colorTextSecondary: "#9ca3af", // gray-400
  },
  // Inherit element styles from light theme
  ...clerkAppearance,
};
