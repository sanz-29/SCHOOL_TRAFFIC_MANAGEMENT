import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { Check, ChevronRight } from 'lucide-react';

export interface WorkflowStep {
  stepNumber: number;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { stepNumber: 1, label: 'School Setup', shortLabel: 'Setup', path: '/setup', description: 'Student cohorts & gate capacity' },
  { stepNumber: 2, label: 'Demand Profile', shortLabel: 'Demand', path: '/demand', description: 'Arrival rates & stop durations' },
  { stepNumber: 3, label: 'Baseline Diagnosis', shortLabel: 'Baseline', path: '/baseline', description: 'Single-bell congestion analysis' },
  { stepNumber: 4, label: 'Constraints', shortLabel: 'Constraints', path: '/constraints', description: 'Hard & soft operational rules' },
  { stepNumber: 5, label: 'Schedule Search', shortLabel: 'Search', path: '/search', description: 'Pareto trade-off exploration' },
  { stepNumber: 6, label: 'Pickup Zones', shortLabel: 'Zones', path: '/zones', description: 'Kerbside capacity & safety verify' },
  { stepNumber: 7, label: 'Simulation Results', shortLabel: 'Simulation', path: '/simulation', description: 'SUMO vs Fast Model metrics' },
  { stepNumber: 8, label: 'Stress Tests', shortLabel: 'Stress Tests', path: '/stress-tests', description: 'Robustness under surge & delays' },
  { stepNumber: 9, label: 'Compare & Approve', shortLabel: 'Approve', path: '/approve', description: 'Principal decision & sign-off' },
  { stepNumber: 10, label: 'Parent Notice', shortLabel: 'Notice', path: '/notice', description: 'Verified English/Tamil dispatch' },
];

export const StepperNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isAuthenticated } = useAuth();

  // Only Principal and Transport Coordinator participate in the 10-step planning workflow
  if (!isAuthenticated || (role !== 'principal' && role !== 'transport_coordinator')) {
    return null;
  }

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.path === location.pathname);

  return (
    <div className="w-full bg-white border-b border-blue-100 px-4 py-2.5 overflow-x-auto">
      <div className="flex items-center min-w-max gap-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = location.pathname === step.path;
          const isCompleted = currentStepIndex > idx;

          return (
            <React.Fragment key={step.stepNumber}>
              <button
                type="button"
                onClick={() => navigate(step.path)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : isCompleted
                    ? 'text-blue-900 bg-blue-50/70 hover:bg-blue-100 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono tabular-nums shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white text-blue-700 font-bold'
                      : isCompleted
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[2.5]" /> : step.stepNumber}
                </span>

                <span className="hidden md:inline">{step.label}</span>
                <span className="md:hidden">{step.shortLabel}</span>
              </button>

              {idx < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
