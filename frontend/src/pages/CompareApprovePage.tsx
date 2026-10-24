import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ApprovedPlan, StudentGroup, PickupZone } from '../types';
import { useAuth } from '../auth';
import { SourceBadge } from '../components/SourceBadge';
import { EngineBadge } from '../components/EngineBadge';
import { FormulaTooltip } from '../components/FormulaTooltip';
import { RunInfoBar } from '../components/RunInfoBar';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';

interface OptionCardData {
  id: string;
  name: string;
  tag: string;
  isRecommended?: boolean;
  shiftsDescription: string;
  zoneStrategy: string;
  peakQueue: number;
  waitP95: number;
  totalDelay: number;
  spillbackMinutes: number;
  simulatedReduction: number;
  uncertaintyBand: string;
  limitations: string;
}

export const CompareApprovePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, can } = useAuth();
  const [approvedPlan, setApprovedPlan] = useState<ApprovedPlan | null>(null);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('cand_balanced');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checklistConfirmed, setChecklistConfirmed] = useState(false);
  const [principalNotes, setPrincipalNotes] = useState(
    'Approved after consultations with Madras City Traffic Police precinct. Two student marshals assigned to Zone C.'
  );
  const [isApproving, setIsApproving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [plan, g, z] = await Promise.all([
          api.getApprovedPlan(),
          api.getStudentGroups(),
          api.getPickupZones(),
        ]);
        setApprovedPlan(plan);
        setGroups(g);
        setZones(z);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const options: OptionCardData[] = [
    {
      id: 'cand_min_change',
      name: 'Option 1: Minimal Routine Change (Plan Alpha)',
      tag: 'Minimal change',
      shiftsDescription: 'Minor ±5m to ±10m shifts. High family comfort; preserves existing morning routines.',
      zoneStrategy: 'Zone A (Cars), Zone B (Buses), Zone C (Autos)',
      peakQueue: 24,
      waitP95: 5.8,
      totalDelay: 780,
      spillbackMinutes: 4.2,
      simulatedReduction: 45.1,
      uncertaintyBand: '±12% queue fluctuation',
      limitations: '4.2 minutes of minor queue spillback remains at 07:52 AM peak.',
    },
    {
      id: 'cand_balanced',
      name: 'Option 2: Balanced Stagger (Plan Beta)',
      tag: 'Balanced',
      isRecommended: true,
      shiftsDescription: '15m KG shift, ±10-15m secondary shifts. Sibling alignment preserved within 5m.',
      zoneStrategy: 'Zone A (KG & P12 Cars), Zone B (High School Buses/Vans), Zone C (Junior Autos)',
      peakQueue: 14,
      waitP95: 3.4,
      totalDelay: 510,
      spillbackMinutes: 0.0,
      simulatedReduction: 64.1,
      uncertaintyBand: '±14% queue fluctuation',
      limitations: 'Requires parent adherence; fragile if compliance drops below 70%.',
    },
    {
      id: 'cand_congestion_focused',
      name: 'Option 3: Maximum Delay Reduction (Plan Gamma)',
      tag: 'Congestion-focused',
      shiftsDescription: 'Aggressive 30-minute spread (-15m to +15m). Highest traffic throughput.',
      zoneStrategy: 'Full zone decoupling across all 3 kerbside locations',
      peakQueue: 9,
      waitP95: 2.1,
      totalDelay: 390,
      spillbackMinutes: 0.0,
      simulatedReduction: 72.5,
      uncertaintyBand: '±16% queue fluctuation',
      limitations: 'High student disruption (16,400 student-minutes). May cause parent pushback on earliest bell.',
    },
    {
      id: 'cand_baseline',
      name: 'Option 4: Keep Existing Schedule (Baseline)',
      tag: 'Keep as is',
      shiftsDescription: 'Zero timing shifts. Single bell at 07:50 AM for all 1,840 students.',
      zoneStrategy: 'All vehicles converge on Main Gate Bay simultaneously',
      peakQueue: 46,
      waitP95: 11.4,
      totalDelay: 1420,
      spillbackMinutes: 18.5,
      simulatedReduction: 0.0,
      uncertaintyBand: '±8% observed variability',
      limitations: 'Severe road spillback for 18.5 minutes; traffic hazard on Arcot Road.',
    },
  ];

  const handleApprove = async () => {
    if (!checklistConfirmed) return;
    setIsApproving(true);
    try {
      const updated = await api.approvePlan(
        selectedPlanId,
        principalNotes,
        checklistConfirmed,
        'Dr. Revathy Soundararajan (Principal)'
      );
      setApprovedPlan(updated);
      setIsModalOpen(false);
      setSuccessNotice('Plan Beta officially approved and sealed. You may now release the Parent Notice.');
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading plan options...</div>;
  }

  const selectedOption = options.find((o) => o.id === selectedPlanId) || options[1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 9: Plan Comparison & Principal Approval</h1>
            <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
              Statutory Decision Gate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate four discrete operational candidates side-by-side. The school principal makes the final administrative decision.
          </p>
        </div>

        {approvedPlan?.status === 'approved' || approvedPlan?.status === 'released_to_parents' ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status: Plan Approved</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/notice')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
            >
              <span>Step 10: Parent Notice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : can('approve_plan') ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Approve Selected Plan</span>
          </button>
        ) : (
          <div className="relative group">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-semibold cursor-not-allowed"
              title="Principal only — Transport Coordinator has review access"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Approve Plan (Principal Only)</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 w-48 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg">
              Statutory approval requires Principal credentials.
            </div>
          </div>
        )}
      </div>

      {/* Advisory banner for non-principal roles */}
      {!can('approve_plan') && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Signed in as <strong>{user?.name || 'Transport Coordinator'}</strong> (Review Mode). You may compare all metrics; statutory plan approval is reserved for the Principal.
            </span>
          </div>
        </div>
      )}

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/notice')}
            className="px-3 py-1 bg-white border border-emerald-300 rounded font-semibold text-xs hover:bg-emerald-100"
          >
            Proceed to Parent Notice →
          </button>
        </div>
      )}

      {/* 4 Option Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {options.map((opt) => {
            const isSelected = selectedPlanId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedPlanId(opt.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white border-blue-100 hover:border-blue-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-slate-900 leading-tight">
                      {opt.name}
                    </span>
                    {opt.isRecommended && (
                      <span className="text-[10px] bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded shrink-0">
                        BEST
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                    {opt.shiftsDescription}
                  </p>

                  <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-slate-500 text-[11px]">Peak Queue:</span>
                      <span className="font-bold text-slate-900">{opt.peakQueue} veh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-slate-500 text-[11px]">P95 Wait:</span>
                      <span className="text-slate-800">{opt.waitP95} min</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="font-sans text-slate-700 text-[11px]">Simulated Reduction:</span>
                      <span
                        className={`tabular-nums ${
                          opt.simulatedReduction > 0 ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {opt.simulatedReduction > 0 ? `-${opt.simulatedReduction.toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] space-y-1">
                  <div className="text-slate-500">
                    <strong>Uncertainty:</strong> {opt.uncertaintyBand}
                  </div>
                  <div className="text-slate-500 line-clamp-2">
                    <strong>Limitation:</strong> {opt.limitations}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Side-by-Side Detailed Specification Matrix */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Side-by-Side Candidate Comparison Matrix</h2>
              <p className="text-xs text-slate-500">
                Detailed comparison of queue spillback, wait times, uncertainty bands, and limitations
              </p>
            </div>
            <EngineBadge engine="SUMO" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Option Name</th>
                  <th className="py-2.5 px-3">Peak Queue</th>
                  <th className="py-2.5 px-3">P95 Wait</th>
                  <th className="py-2.5 px-3">Total Delay (J_delay)</th>
                  <th className="py-2.5 px-3">Spillback Minutes</th>
                  <th className="py-2.5 px-3">Simulated Reduction</th>
                  <th className="py-2.5 px-3">Uncertainty</th>
                  <th className="py-2.5 px-3">Primary Operational Limitation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {options.map((opt) => (
                  <tr
                    key={opt.id}
                    className={opt.id === selectedPlanId ? 'bg-blue-50/70 font-semibold' : 'hover:bg-blue-50/30 font-normal'}
                  >
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {opt.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900">{opt.peakQueue} veh</td>
                    <td className="py-2.5 px-3 text-slate-800">{opt.waitP95} min</td>
                    <td className="py-2.5 px-3 text-slate-800">{opt.totalDelay} veh-min</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {opt.spillbackMinutes === 0 ? (
                        <span className="text-emerald-700">0.0 min (None)</span>
                      ) : (
                        <span className="text-rose-600">{opt.spillbackMinutes} min</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={opt.simulatedReduction > 0 ? 'text-emerald-700' : 'text-slate-500'}>
                        {opt.simulatedReduction > 0 ? `-${opt.simulatedReduction}%` : '0%'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">{opt.uncertaintyBand}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">{opt.limitations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Principal Approval Dialog Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl border border-blue-100 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Principal Formal Approval</h3>
                    <span className="text-xs text-slate-500">{selectedOption.name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-semibold">Simulated Operational Impact:</div>
                <div>• Peak queue reduced from 46 to 14 vehicles (-64.1% simulated)</div>
                <div>• Curbside spillback reduced from 18.5 min to 0.0 minutes</div>
                <div>• Sibling alignment preserved within 5-minute arrival window</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">
                  Principal Administrative Directive / Committee Notes:
                </label>
                <textarea
                  rows={3}
                  value={principalNotes}
                  onChange={(e) => setPrincipalNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-blue-200 rounded-lg text-slate-800 focus:outline-blue-600 bg-white"
                />
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5 text-xs">
                <input
                  type="checkbox"
                  id="confirmCheck"
                  checked={checklistConfirmed}
                  onChange={(e) => setChecklistConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 accent-blue-700 cursor-pointer"
                />
                <label htmlFor="confirmCheck" className="text-slate-700 cursor-pointer leading-relaxed">
                  I confirm that I have reviewed the simulated model assumptions, physical zone capacity limits, and safety verification checklists. I approve this staggered operational schedule for pilot rollout.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!checklistConfirmed || isApproving}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproving ? 'Authorizing...' : 'Sign & Formally Approve Plan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
