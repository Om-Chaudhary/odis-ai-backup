"use client";

import type { RefObject } from "react";
import { useEventListener } from "./use-event-listener";

type EventType =
  | "mousedown"
  | "mouseup"
  | "touchstart"
  | "touchend"
  | "focusin"
  | "focusout";

/**
 * Hook to detect clicks outside of a referenced element
 *
 * @param ref - Single ref or array of refs to exclude from "outside" detection
 * @param handler - Callback when click outside is detected
 * @param eventType - Event type to listen for (default: "mousedown")
 * @param eventListenerOptions - Options for addEventListener
 *
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useOnClickOutside(dropdownRef, () => setIsOpen(false));
 * ```
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: MouseEvent | TouchEvent | FocusEvent) => void,
  eventType: EventType = "mousedown",
  eventListenerOptions: AddEventListenerOptions = {},
): void {
  useEventListener(
    eventType,
    (event) => {
      const target = event.target as Node;

      // Do nothing if the target is not connected element with document
      if (!target?.isConnected) {
        return;
      }

      const isOutside = Array.isArray(ref)
        ? ref
            .filter((r) => Boolean(r.current))
            .every((r) => r.current && !r.current.contains(target))
        : ref.current && !ref.current.contains(target);

      if (isOutside) {
        handler(event);
      }
    },
    undefined,
    eventListenerOptions,
  );
}

export type { EventType };
