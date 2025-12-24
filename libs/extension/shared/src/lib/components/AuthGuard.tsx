import { useAuth } from '../supabase/auth-context';
import type React from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Auth Guard Component
 *
 * Renders children only when user is authenticated.
 * Shows loading component during auth check.
 * Shows fallback when unauthenticated.
 *
 * @example
 * ```tsx
 * <AuthGuard
 *   fallback={<UnauthenticatedView />}
 *   loadingComponent={<LoadingSpinner />}
 * >
 *   <AuthenticatedContent />
 * </AuthGuard>
 * ```
 */
export const AuthGuard = ({ children, fallback = null, loadingComponent = null }: AuthGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
