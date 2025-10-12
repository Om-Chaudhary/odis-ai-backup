import type { User } from "@supabase/supabase-js";
import type {
  users,
  cases,
  patients,
  transcriptions,
  audioFiles,
  soapNotes,
  templates,
  generations,
  dischargeSummaries,
  contactSubmissions,
  tempSoapTemplates,
} from "~/server/db/schema";

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: typeof users.$inferSelect;
        Insert: typeof users.$inferInsert;
        Update: Partial<typeof users.$inferInsert>;
      };
      cases: {
        Row: typeof cases.$inferSelect;
        Insert: typeof cases.$inferInsert;
        Update: Partial<typeof cases.$inferInsert>;
      };
      patients: {
        Row: typeof patients.$inferSelect;
        Insert: typeof patients.$inferInsert;
        Update: Partial<typeof patients.$inferInsert>;
      };
      transcriptions: {
        Row: typeof transcriptions.$inferSelect;
        Insert: typeof transcriptions.$inferInsert;
        Update: Partial<typeof transcriptions.$inferInsert>;
      };
      audioFiles: {
        Row: typeof audioFiles.$inferSelect;
        Insert: typeof audioFiles.$inferInsert;
        Update: Partial<typeof audioFiles.$inferInsert>;
      };
      soapNotes: {
        Row: typeof soapNotes.$inferSelect;
        Insert: typeof soapNotes.$inferInsert;
        Update: Partial<typeof soapNotes.$inferInsert>;
      };
      templates: {
        Row: typeof templates.$inferSelect;
        Insert: typeof templates.$inferInsert;
        Update: Partial<typeof templates.$inferInsert>;
      };
      generations: {
        Row: typeof generations.$inferSelect;
        Insert: typeof generations.$inferInsert;
        Update: Partial<typeof generations.$inferInsert>;
      };
      dischargeSummaries: {
        Row: typeof dischargeSummaries.$inferSelect;
        Insert: typeof dischargeSummaries.$inferInsert;
        Update: Partial<typeof dischargeSummaries.$inferInsert>;
      };
      contactSubmissions: {
        Row: typeof contactSubmissions.$inferSelect;
        Insert: typeof contactSubmissions.$inferInsert;
        Update: Partial<typeof contactSubmissions.$inferInsert>;
      };
      tempSoapTemplates: {
        Row: typeof tempSoapTemplates.$inferSelect;
        Insert: typeof tempSoapTemplates.$inferInsert;
        Update: Partial<typeof tempSoapTemplates.$inferInsert>;
      };
    };
  };
};

// Auth types
export type AuthUser = User;

// Extended user type with related data
export type UserWithProfile = typeof users.$inferSelect & {
  cases?: (typeof cases.$inferSelect)[];
  patients?: (typeof patients.$inferSelect)[];
  transcriptions?: (typeof transcriptions.$inferSelect)[];
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
export type ApiResponse<T = any> = {
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
