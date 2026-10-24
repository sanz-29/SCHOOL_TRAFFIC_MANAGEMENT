import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF] text-slate-600">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-3" />
        <span className="text-xs font-medium">Verifying GateFlow security credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while preserving the attempted location in state
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
};
