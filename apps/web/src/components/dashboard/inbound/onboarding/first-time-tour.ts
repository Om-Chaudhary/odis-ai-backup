import type { Tour } from "onborda/dist/types";
import { createElement } from "react";
import {
  PhoneIncoming,
  Calendar,
  FileText,
  Keyboard,
  MousePointer,
} from "lucide-react";

/**
 * First-time user tour for inbound dashboard
 *
 * Covers essential features of the current implementation:
 * 1. Overview of the dashboard
 * 2. Outcome filtering in sidebar
 * 3. Row selection for details
 * 4. Detail panel features
 * 5. Keyboard navigation shortcuts
 */
export const firstTimeTour: Tour = {
  tour: "inbound-first-time",
  steps: [
    {
      icon: createElement(PhoneIncoming, { className: "h-5 w-5" }),
      title: "Welcome to Inbound Calls",
      content:
        "This dashboard shows all incoming calls handled by your AI assistant. Let's walk through the key features.",
      selector: "#inbound-page-container",
      side: "top",
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
      title: "View Call Details",
      content:
        "Click any row to see the full call details, including caller information, summary, and recording. The panel opens on the right.",
      selector: "[data-row-index='0']", // First table row
      side: "right",
      showControls: true,
    },
    {
      icon: createElement(FileText, { className: "h-5 w-5" }),
      title: "Call Summary & Recording",
      content:
        "When you select a call, you'll see a detailed summary, actions taken, and can play the call recording.",
      selector: "#call-detail-panel",
      side: "left",
      showControls: true,
    },
    {
      icon: createElement(Keyboard, { className: "h-5 w-5" }),
      title: "Keyboard Shortcuts",
      content:
        "Navigate efficiently: Arrow Up/Down to cycle through calls, Enter to open details, Escape to close the panel.",
      selector: "#inbound-table",
      side: "top",
      showControls: true,
    },
  ],
};
