import type { Tour } from "onborda/dist/types";
import { createElement } from "react";
import { PhoneIncoming, Calendar, Keyboard, MousePointer } from "lucide-react";

/**
 * First-time user tour for inbound dashboard
 *
 * Covers essential features of the current implementation:
 * 1. Overview of the dashboard (targets nav filters for stable positioning)
 * 2. Outcome filtering in sidebar
 * 3. Calls table overview
 * 4. Row selection for details
 *
 * Note: Selectors target elements outside the overflow cascade for reliable positioning.
 * The OnboardingProvider must be placed at the dashboard layout level (outside z-10).
 */
export const firstTimeTour: Tour = {
  tour: "inbound-first-time",
  steps: [
    {
      icon: createElement(PhoneIncoming, { className: "h-5 w-5" }),
      title: "Welcome to Inbound Calls",
      content:
        "This dashboard shows all incoming calls handled by your AI assistant. Let's walk through the key features.",
      selector: "#inbound-nav-filters",
      side: "right",
      showControls: true,
    },
    {
      icon: createElement(Calendar, { className: "h-5 w-5" }),
      title: "Filter by Outcome",
      content:
        "Use these filters to view specific call types: Appointments, Callbacks, Emergencies, or Information requests. The badge shows the count for each category.",
      selector: "#inbound-nav-filters",
      side: "right",
      showControls: true,
    },
    {
      icon: createElement(MousePointer, { className: "h-5 w-5" }),
      title: "Your Calls Table",
      content:
        "All incoming calls are listed here. You can see caller info, outcome type, duration, and timestamp at a glance.",
      selector: "#inbound-table",
      side: "top",
      showControls: true,
    },
    {
      icon: createElement(Keyboard, { className: "h-5 w-5" }),
      title: "View Details & Navigate",
      content:
        "Click any row to see full details in a side panel. Use Arrow keys to navigate, Enter to select, and Escape to close.",
      selector: "#inbound-table",
      side: "top",
      showControls: true,
    },
  ],
};
