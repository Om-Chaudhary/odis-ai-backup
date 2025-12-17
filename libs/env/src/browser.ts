/**
 * Browser-safe environment access
 * For extension use, env vars are injected at build time via Vite define
 */

export interface BrowserEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SITE_URL: string;
}

// These globals are defined at build time by Vite
declare global {
  const __SUPABASE_URL__: string | undefined;
  const __SUPABASE_ANON_KEY__: string | undefined;
  const __SITE_URL__: string | undefined;
}

export const browserEnv: BrowserEnv = {
  SUPABASE_URL:
    typeof __SUPABASE_URL__ !== "undefined"
      ? __SUPABASE_URL__
      : typeof process !== "undefined"
        ? (process.env?.NEXT_PUBLIC_SUPABASE_URL ?? "")
        : "",
  SUPABASE_ANON_KEY:
    typeof __SUPABASE_ANON_KEY__ !== "undefined"
      ? __SUPABASE_ANON_KEY__
      : typeof process !== "undefined"
        ? (process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
        : "",
  SITE_URL:
    typeof __SITE_URL__ !== "undefined"
      ? __SITE_URL__
      : typeof process !== "undefined"
        ? (process.env?.NEXT_PUBLIC_SITE_URL ?? "")
        : "",
};

export const IS_BROWSER = typeof window !== "undefined";
