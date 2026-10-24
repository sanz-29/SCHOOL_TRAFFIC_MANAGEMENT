import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_CONFIG, getRoleLandingPage } from '../auth';
import {
  LogOut,
  User,
  Shield,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { user, role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setShowUserMenu(false);
    await logout();
    navigate('/login', { replace: true });
  };

  // Determine current page title from pathname
  const getPageTitle = (path: string): string => {
    if (path === '/' || path === '/dashboard') return 'Executive Dashboard';
    if (path.startsWith('/setup')) return 'School Setup & Cohorts';
    if (path.startsWith('/demand')) return 'Peak Demand Profile';
    if (path.startsWith('/baseline')) return 'Baseline Diagnosis';
    if (path.startsWith('/constraints')) return 'Operational Constraints';
    if (path.startsWith('/search')) return 'Schedule Search & Trade-Offs';
    if (path.startsWith('/zones')) return 'Pickup Zones & Verification';
    if (path.startsWith('/simulation')) return 'Simulation Results';
    if (path.startsWith('/stress-tests')) return 'Robustness Stress Tests';
    if (path.startsWith('/approve')) return 'Plan Comparison & Approval';
    if (path.startsWith('/notice/public')) return 'Public Parent Notice';
    if (path.startsWith('/notice')) return 'Parent Advisory Notice';
    if (path.startsWith('/follow-up')) return 'Gate Follow-up Measurement';
    if (path.startsWith('/assumptions')) return 'Assumptions & Engineering Limits';
    if (path === '/403') return 'Access Denied';
    if (path === '/404') return 'Page Not Found';
    return 'Decision Support';
  };

  const currentTitle = getPageTitle(location.pathname);
  const roleTitle = role ? ROLE_CONFIG[role]?.roleTitle : 'Public Guest';
  const isPublicRoute = location.pathname.startsWith('/notice/public');

  return (
    <header className="h-14 border-b border-blue-100 bg-white px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-40 shadow-2xs">
      {/* Zone 1: Brand Wordmark & Current Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to={role ? getRoleLandingPage(role) : '/login'}
          className="flex items-center gap-2 text-blue-700 font-bold text-lg tracking-tight whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-base shadow-xs">
            G
          </div>
          <span className="text-slate-900">GateFlow</span>
          <span className="text-blue-700 font-semibold">AI</span>
        </Link>

        <span className="text-slate-300 hidden sm:inline">/</span>

        <span className="hidden sm:inline font-semibold text-slate-800 text-xs truncate max-w-xs md:max-w-md">
          {currentTitle}
        </span>
      </div>

      {/* Zone 2: Navigation Links for Staff */}
      {isAuthenticated && role !== 'gate_staff' && !isPublicRoute && (
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-600">
          <Link to="/dashboard" className="hover:text-blue-700 transition-colors whitespace-nowrap">
            Dashboard
          </Link>
          <Link to="/search" className="hover:text-blue-700 transition-colors whitespace-nowrap">
            Schedule Search
          </Link>
          <Link to="/simulation" className="hover:text-blue-700 transition-colors whitespace-nowrap">
            Simulation
          </Link>
          <Link to="/approve" className="hover:text-blue-700 transition-colors whitespace-nowrap">
            Approve Plan
          </Link>
          <Link to="/notice/public" target="_blank" className="hover:text-blue-700 transition-colors whitespace-nowrap inline-flex items-center gap-1">
            <span>Public Notice</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </nav>
      )}

      {/* Zone 3: User Details, Role Pill & Logout Button */}
      <div className="flex items-center gap-2.5 shrink-0">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {/* User Profile Pill Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-blue-100 bg-blue-50/60 hover:bg-blue-100/60 transition-colors text-xs cursor-pointer"
                aria-expanded={showUserMenu}
              >
                <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-slate-900 text-xs leading-none">
                    {user.name}
                  </div>
                </div>
                {/* Role Pill Badge */}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {user.role === 'principal'
                    ? 'Principal'
                    : user.role === 'transport_coordinator'
                    ? 'Transport Lead'
                    : 'Gate Staff'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-blue-100 shadow-xl p-3 z-50 text-xs">
                  <div className="pb-2.5 mb-2 border-b border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Signed in as
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">{user.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{user.email}</div>
                    <div className="mt-1 text-[11px] text-blue-700 font-medium">
                      {user.title} · {user.department}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to={getRoleLandingPage(user.role)}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-2.5 py-1.5 rounded-md hover:bg-blue-50 text-slate-700 font-medium"
                    >
                      My Role Landing Page
                    </Link>
                    <Link
                      to="/notice/public"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-2.5 py-1.5 rounded-md hover:bg-blue-50 text-slate-700 font-medium"
                    >
                      Public Parent Notice
                    </Link>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-rose-700 hover:bg-rose-50 font-semibold flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out of GateFlow AI"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <span>Staff Sign In</span>
          </Link>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-blue-100 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Sign Out</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to end your active GateFlow session?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-semibold shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
