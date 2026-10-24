import React from 'react';
import { SourceBadge } from '../components/SourceBadge';
import { EngineBadge } from '../components/EngineBadge';
import { FormulaTooltip } from '../components/FormulaTooltip';
import {
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode,
  Terminal,
  Layers,
  HelpCircle
} from 'lucide-react';

export const AssumptionsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-700" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Assumptions, Statutory Limits & Engineering Reference
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Complete documentation of model boundaries, provenance classifications, and mathematical formulations.
        </p>
      </div>

      {/* What GateFlow AI Does and Does Not Claim */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>What GateFlow AI Does</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
            <li>
              Simulates vehicular queue evolution outside school gates under staggered bell schedules.
            </li>
            <li>
              Quantifies Pareto trade-offs between physical road delay (J_delay) and family schedule disruption (J_disruption).
            </li>
            <li>
              Validates curbside bay capacities against physical vehicle lengths and safety gaps before zone assignment.
            </li>
            <li>
              Exposes operational fragility under monsoon rain surges and low parent timing compliance.
            </li>
            <li>
              Generates bilingual, verified circular notices that match approved timetable parameters with zero human transcription error.
            </li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>What GateFlow AI Does Not Claim</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
            <li>
              <strong>No real-world guarantee:</strong> Percent reductions are strictly simulated outputs under stated assumptions; real benefit requires an on-site school pilot.
            </li>
            <li>
              <strong>Not an automatic traffic controller:</strong> GateFlow AI never actuates city signals or barriers. The school principal retains final statutory discretion.
            </li>
            <li>
              <strong>Out of scope:</strong> Does not perform GPS parent tracking, automatic road redesign, Bluetooth beacon detection, or carpool ride matching.
            </li>
            <li>
              <strong>Safety verification:</strong> Zones remain legally unverified until authorized human personnel execute physical inspection.
            </li>
          </ul>
        </div>
      </div>

      {/* Data Provenance Categories */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Three Data Provenance Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900">1. Observed Data</span>
              <SourceBadge source="Observed" />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Empirical ground-truth collected through manual video tallies, gate security logs, or municipal cordon counts. Highest confidence level.
            </p>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900">2. Synthetic Data</span>
              <SourceBadge source="Synthetic" />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Statistically generated cohort arrivals calibrated to enrolled student census and modal split surveys. Includes ±14% uncertainty envelopes.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">3. Assumed Data</span>
              <SourceBadge source="Assumed" />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Standard civil engineering defaults: 4.6m car lengths, 1.5m stopping buffers, and 45s dwell averages based on regional transit norms.
            </p>
          </div>
        </div>
      </div>

      {/* Glossary of Mathematical Formulations */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Engineering Metrics Glossary & Formulas</h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#F8FAFF] rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Total Vehicle Delay (J_delay)</span>
              <span className="font-mono text-blue-700 font-semibold">J_delay = ∑ (Q_t × Δt)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Expressed in vehicle-minutes. Sum of instantaneous queue length Q at each time step Δt. Represents the total collective idling time experienced by all drop-off vehicles.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFF] rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Schedule Disruption Penalty (J_disruption)</span>
              <span className="font-mono text-blue-700 font-semibold">J_disruption = ∑ (N_g × |shift_g|)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Expressed in student-minutes. Cohort size N_g multiplied by absolute time shift in minutes from the accustomed schedule. Penalizes excessive routine disturbance.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFF] rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Pickup Zone Kerbside Capacity</span>
              <span className="font-mono text-blue-700 font-semibold">Capacity = ⌊ L_usable / (L_vehicle + gap) ⌋</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Maximum concurrent vehicles a bay can safely accommodate without spilling into the adjacent moving lane.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFF] rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Simulated Change Percentage</span>
              <span className="font-mono text-blue-700 font-semibold">Simulated Change = 100 × (Baseline - Candidate) / Baseline</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Must always be labelled with the qualification "simulated". Reflects relative queue or delay reduction against single-bell baseline.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Integration Architecture Guide */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            FastAPI Backend Connection Guide (src/api/)
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The applet includes a centralized mock API layer in <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded">src/api/index.ts</code>. All endpoint calls are strictly quarantined inside this folder.
        </p>
        <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
          <code>
            {'// To swap for real FastAPI endpoints in production:'}<br />
            {'// 1. Set VITE_API_BASE_URL=https://api.gateflow.school.edu in .env'}<br />
            {'// 2. In src/api/index.ts, replace in-memory fixtures with real HTTP fetch calls'}
          </code>
        </div>
      </div>
    </div>
  );
};
