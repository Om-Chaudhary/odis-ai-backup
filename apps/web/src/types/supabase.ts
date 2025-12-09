import type { User } from "@supabase/supabase-js";
import type { Database } from "~/database.types";
import { type createClient } from "@odis/db/server";

// Auth types
export type AuthUser = User;

// Extended user type with related data
export type UserWithProfile = Database["public"]["Tables"]["users"]["Row"] & {
  cases?: Database["public"]["Tables"]["cases"]["Row"][];
  patients?: Database["public"]["Tables"]["patients"]["Row"][];
  transcriptions?: Database["public"]["Tables"]["transcriptions"]["Row"][];
};

// Session type
export type Session = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

// Auth state type
export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

// Form data types
export type SignUpData = {
  email: string;
  password: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export type ProfileData = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  clinicName?: string;
  licenseNumber?: string;
  onboardingCompleted?: boolean;
};

// API response types
export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  success: boolean;
};

export type AuthResponse = ApiResponse<{
  user: AuthUser;
  session: Session;
}>;

// Route types
export type AuthRoute = "/login" | "/signup" | "/dashboard";
export type ProtectedRoute = "/dashboard";

// Middleware types
export type MiddlewareConfig = {
  protectedRoutes: string[];
  authRoutes: string[];
  redirectTo: string;
};

/* ========================================
   Supabase Client Types
   ======================================== */

/**
 * Type-safe Supabase client matching the pattern used throughout the codebase
 * Use this type for service methods that accept a Supabase client
 */
export type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;
