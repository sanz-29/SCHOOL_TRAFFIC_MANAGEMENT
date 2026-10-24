import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getRoleLandingPage, ROLE_CONFIG } from '../auth';
import { ShieldAlert, ArrowLeft, LogOut, Home, Lock } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const attemptedPath = (location.state as any)?.attemptedPath || 'the requested page';
  const userLanding = role ? getRoleLandingPage(role) : '/login';
  const roleTitle = role ? ROLE_CONFIG[role]?.roleTitle : 'Guest';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm max-w-md w-full p-6 text-center space-y-5">
        <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <div className="inline-block px-2.5 py-0.5 bg-amber-100/70 text-amber-900 rounded font-mono text-[11px] font-bold mb-2">
            HTTP 403 · ACCESS FORBIDDEN
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Permission Restricted
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your current account credentials as <strong className="text-blue-900">{roleTitle}</strong> do not have administrative clearance to access <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{attemptedPath}</span>.
          </p>
        </div>

        {user && (
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Session</div>
            <div className="font-semibold text-slate-900 mt-0.5">{user.name}</div>
            <div className="text-slate-500 text-[11px] font-mono">{user.email}</div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(userLanding)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Role Workspace</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
