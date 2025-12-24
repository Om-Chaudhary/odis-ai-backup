/**
 * Managed event listener hook with automatic cleanup
 * Prevents listener accumulation from component remounts
 */
import { useEffect, useRef } from "react";

export type EventListenerTarget =
  | Window
  | Document
  | HTMLElement
  | null
  | undefined;

/**
 * Hook to safely add event listeners with automatic cleanup
 *
 * This hook prevents memory leaks from event listener accumulation by:
 * - Automatically removing listeners on unmount
 * - Preventing stale closure references with useRef
 * - Supporting all event target types (window, document, elements)
 *
 * @example
 * ```tsx
 * useEventListener('click', (e) => {
 *   console.log('Clicked!', e);
 * }, document.body);
 * ```
 *
 * @example
 * ```tsx
 * // Listen to window resize
 * useEventListener('resize', () => {
 *   console.log('Window resized');
 * });
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  target?: Window,
  options?: boolean | AddEventListenerOptions,
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  target: Document,
  options?: boolean | AddEventListenerOptions,
): void;

export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  target: HTMLElement | null | undefined,
  options?: boolean | AddEventListenerOptions,
): void;

export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  target: EventListenerTarget = window,
  options?: boolean | AddEventListenerOptions,
): void {
  const handlerRef = useRef(handler);

  // Keep handler fresh without re-adding listener
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target?.addEventListener) {
      return;
    }

    const eventListener = (event: Event) => handlerRef.current(event);

    target.addEventListener(eventName, eventListener, options);

    // Cleanup function
    return () => {
      target.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, target, options]);
}
