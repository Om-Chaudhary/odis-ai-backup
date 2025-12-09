"use client";

import { useLayoutEffect, useEffect } from "react";

/**
 * SSR-safe useLayoutEffect that falls back to useEffect on server.
 * Use this instead of useLayoutEffect when the code may run on the server.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
