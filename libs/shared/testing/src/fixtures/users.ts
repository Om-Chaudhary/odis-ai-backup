/**
 * User fixture generators
 *
 * Provides factories for creating test user data
 */
import type { User, Session } from "@supabase/supabase-js";

/**
 * Create a mock Supabase User
 */
export function createMockUser(overrides?: Partial<User>): User {
  const id = overrides?.id ?? `user-${Date.now()}`;
  const email = overrides?.email ?? `test-${id}@example.com`;

  return {
    id,
    email,
    phone: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: undefined,
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
      ...overrides?.app_metadata,
    },
    user_metadata: {
      full_name: "Test User",
      avatar_url: undefined,
      ...overrides?.user_metadata,
    },
    aud: "authenticated",
    role: "authenticated",
    identities: [],
    factors: [],
    is_anonymous: false,
    ...overrides,
  } as User;
}

/**
 * Create a mock Supabase Session
 */
export function createMockSession(options?: {
  user?: User;
  expiresIn?: number;
}): Session {
  const user = options?.user ?? createMockUser();
  const expiresIn = options?.expiresIn ?? 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  return {
    access_token: `test-access-token-${Date.now()}`,
    refresh_token: `test-refresh-token-${Date.now()}`,
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: "bearer",
    user,
  };
}

/**
 * Create a mock clinic user profile
 */
export interface MockClinicUser {
  id: string;
  user_id: string;
  clinic_id: string;
  role: "owner" | "admin" | "staff" | "veterinarian";
  created_at: string;
  updated_at: string;
}

export function createMockClinicUser(
  overrides?: Partial<MockClinicUser>,
): MockClinicUser {
  return {
    id: `clinic-user-${Date.now()}`,
    user_id: `user-${Date.now()}`,
    clinic_id: `clinic-${Date.now()}`,
    role: "staff",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock clinic
 */
export interface MockClinic {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  settings?: Record<string, unknown>;
}

export function createMockClinic(overrides?: Partial<MockClinic>): MockClinic {
  const id = overrides?.id ?? `clinic-${Date.now()}`;
  return {
    id,
    name: "Test Veterinary Clinic",
    slug: "test-vet-clinic",
    phone: "+15551234567",
    email: "clinic@example.com",
    timezone: "America/New_York",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {},
    ...overrides,
  };
}

/**
 * Create authenticated test context
 */
export function createAuthenticatedContext(options?: {
  userId?: string;
  clinicId?: string;
  role?: MockClinicUser["role"];
}) {
  const user = createMockUser({ id: options?.userId });
  const session = createMockSession({ user });
  const clinic = createMockClinic({ id: options?.clinicId });
  const clinicUser = createMockClinicUser({
    user_id: user.id,
    clinic_id: clinic.id,
    role: options?.role ?? "staff",
  });

  return {
    user,
    session,
    clinic,
    clinicUser,
    token: session.access_token,
  };
}
