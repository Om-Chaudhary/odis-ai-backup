import type { User, Session } from "@supabase/supabase-js";

export type AuthUser = User | null;
export type AuthSession = Session | null;

export interface AuthState {
  user: AuthUser;
  session: AuthSession;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
