import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, ROLE_CONFIG } from '../auth';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Activity,
  Sliders,
  Search,
  MapPin,
  BarChart3,
  Flame,
  CheckCircle,
  FileText,
  ClipboardList,
  BookOpen,
  Eye,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, role } = useAuth();

  if (!role || role === 'parent') {
    return null;
  }

  // Define full staff navigation structure
  const fullNavGroups = [
    {
      title: 'Overview',
      items: [
        { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Planning & Setup',
      items: [
        { label: '1. School Setup', path: '/setup', icon: Building2 },
        { label: '2. Demand Profile', path: '/demand', icon: TrendingUp },
        { label: '3. Baseline Diagnosis', path: '/baseline', icon: Activity },
        { label: '4. Constraints', path: '/constraints', icon: Sliders },
      ],
    },
    {
      title: 'Search & Simulation',
      items: [
        { label: '5. Schedule Search', path: '/search', icon: Search },
        { label: '6. Pickup Zones', path: '/zones', icon: MapPin },
        { label: '7. Simulation Results', path: '/simulation', icon: BarChart3 },
        { label: '8. Stress Tests', path: '/stress-tests', icon: Flame },
      ],
    },
    {
      title: 'Governance & Action',
      items: [
        { label: '9. Compare & Approve', path: '/approve', icon: CheckCircle },
        { label: '10. Parent Notice (Editor)', path: '/notice', icon: FileText },
        { label: '11. Follow-up Counts', path: '/follow-up', icon: ClipboardList },
        { label: '12. Limits & Reference', path: '/assumptions', icon: BookOpen },
      ],
    },
  ];

  // Simplified layout for Gate Staff
  const gateStaffNavGroups = [
    {
      title: 'Gate Operations',
      items: [
        { label: 'Follow-up Counts', path: '/follow-up', icon: ClipboardList },
        { label: 'Approved Plan Notice', path: '/notice/public', icon: Eye },
        { label: 'Limits & Glossary', path: '/assumptions', icon: BookOpen },
      ],
    },
  ];

  const navGroups = role === 'gate_staff' ? gateStaffNavGroups : fullNavGroups;
  const roleTitle = ROLE_CONFIG[role]?.roleTitle || 'Authorized Staff';

  return (
    <aside className="w-64 bg-white border-r border-blue-100 flex flex-col shrink-0 overflow-y-auto">
      {/* Active User Header */}
      <div className="p-4 border-b border-blue-50 bg-[#F8FAFF]">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Active Workspace
        </div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="font-semibold text-slate-900 text-xs truncate">
            {user?.name || 'GateFlow User'}
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            {role === 'principal' ? 'Principal' : role === 'transport_coordinator' ? 'Coordinator' : 'Gate Staff'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 truncate">
          You are signed in as <strong className="text-slate-700">{roleTitle}</strong>
        </div>
      </div>

      {/* Navigation Links Filtered by Role */}
      <div className="py-3 px-2 flex-1 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors font-medium ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                          : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/70'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Persistent Bottom Institution Indicator */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
        <span className="truncate">St. Jude's Academy (Vadapalani)</span>
      </div>
    </aside>
  );
};
