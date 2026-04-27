import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Home is reserved for dev/admin roles (admin = AD, stats_admin).
 * Coaches, students, and viewers are redirected to /dashboard.
 */
export function HomeGate({ children }: { children: ReactNode }) {
  const { isAdmin, isStatsAdmin } = useAuth();
  const allowed = isAdmin || isStatsAdmin;
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
