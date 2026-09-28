import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@belago/shared';
import { useAuth } from '../context/AuthContext.js';

interface RoleRouteProps {
  role: Role;
}

export function RoleRoute({ role }: RoleRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />;

  return <Outlet />;
}

export function roleHome(role: Role): string {
  if (role === 'profissional') return '/profissional';
  if (role === 'admin') return '/admin';
  return '/cliente';
}
