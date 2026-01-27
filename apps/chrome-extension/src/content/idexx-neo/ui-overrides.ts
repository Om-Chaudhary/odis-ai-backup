/**
 * UI override utilities for IDEXX Neo
 *
 * Provides functions to extract data and inject UI elements.
 */

import { IDEXX_SELECTORS, getTextFromSelector } from "./selectors";
import type { IdexxPatientData } from "./types";

/**
 * Extract patient data from the current page
 */
export function extractPatientData(): IdexxPatientData | null {
  const patientName = getTextFromSelector(IDEXX_SELECTORS.patient.name);
  const patientId = getTextFromSelector(IDEXX_SELECTORS.patient.id);
  const clientName = getTextFromSelector(IDEXX_SELECTORS.client.name);
  const species = getTextFromSelector(IDEXX_SELECTORS.patient.species);
  const breed = getTextFromSelector(IDEXX_SELECTORS.patient.breed);

  // Only return if we found at least some data
  if (!patientName && !patientId && !clientName) {
    return null;
  }

  return {
    patientId: patientId ?? undefined,
    patientName: patientName ?? undefined,
    clientName: clientName ?? undefined,
    species: species ?? undefined,
    breed: breed ?? undefined,
  };
}

/**
 * Inject an ODIS AI action button into the page
 */
export function injectOdisButton(
  targetSelector: string,
  onClick: () => void
): HTMLButtonElement | null {
  const target = document.querySelector(targetSelector);
  if (!target) return null;

  // Check if already injected
  if (target.querySelector("[data-odis-extension]")) {
    return null;
  }

  const button = document.createElement("button");
  button.setAttribute("data-odis-extension", "true");
  button.className = "odis-action-button";
  button.textContent = "ODIS AI";
  button.title = "Open ODIS AI discharge assistant";
  button.onclick = onClick;

  // Apply basic styling
  Object.assign(button.style, {
    marginLeft: "8px",
    padding: "6px 12px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  });

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#2563eb";
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "#3b82f6";
  });

  target.appendChild(button);
  return button;
}

/**
 * Create a floating ODIS AI widget
 */
export function createFloatingWidget(): HTMLDivElement {
  const widget = document.createElement("div");
  widget.setAttribute("data-odis-extension", "true");
  widget.id = "odis-floating-widget";

  Object.assign(widget.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "60px",
    height: "60px",
    backgroundColor: "#3b82f6",
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "10000",
    transition: "transform 0.2s, box-shadow 0.2s",
  });

  widget.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `;

  widget.addEventListener("mouseenter", () => {
    widget.style.transform = "scale(1.1)";
    widget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
  });

  widget.addEventListener("mouseleave", () => {
    widget.style.transform = "scale(1)";
    widget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  });

  document.body.appendChild(widget);
  return widget;
}
