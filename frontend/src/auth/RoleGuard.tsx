import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';
import { can as canCheck, AuthAction } from './permissions';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  action?: AuthAction;
  fallback?: React.ReactNode;
  redirectTo?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  action,
  fallback,
  redirectTo = '/403',
  children,
}) => {
  const { role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  // Determine authorization
  let isAuthorized = false;

  if (allowedRoles && role) {
    isAuthorized = allowedRoles.includes(role);
  } else if (action && role) {
    isAuthorized = canCheck(role, action);
  } else if (!allowedRoles && !action) {
    isAuthorized = isAuthenticated;
  }

  if (!isAuthorized) {
    // If a fallback UI element was explicitly provided (inline element guard), render that
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    // Otherwise, this is guarding a page route, so redirect to 403 Forbidden
    return <Navigate to={redirectTo} state={{ attemptedPath: location.pathname }} replace />;
  }

  return <>{children}</>;
};
