import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { UserRole } from '../types';
import { Lock, ArrowRight, UserCheck } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  title?: string;
  description?: string;
  requiredRoleName?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  title = 'Administrative Approval Restricted',
  description = 'This action can only be performed by the Principal. Transport Coordinators and Gate Staff have review and simulation privileges.',
  requiredRoleName = 'Principal',
  children,
}) => {
  const { userRole, setUserRole } = useAppStore();

  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">{description}</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setUserRole(allowedRoles[0])}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch Role to {requiredRoleName} (Demo)</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
