import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CandidateSchedule, StudentGroup } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { EngineBadge } from '../components/EngineBadge';
import { ChartCard } from '../components/ChartCard';
import { FormulaTooltip } from '../components/FormulaTooltip';
import { RunInfoBar } from '../components/RunInfoBar';
import { useAppStore } from '../store/useAppStore';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';

export const ScheduleSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedScheduleId } = useAppStore();
  const [candidates, setCandidates] = useState<CandidateSchedule[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSchedule | null>(null);
  const [alphaDelay, setAlphaDelay] = useState<number>(0.6); // weight for delay
  const [rawCount, setRawCount] = useState(117649);
  const [feasibleCount, setFeasibleCount] = useState(421);
  const [sortField, setSortField] = useState<'jDelay' | 'jDisruption' | 'peakQueue' | 'simulatedReductionVsBaselinePct'>('jDelay');
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [res, grps] = await Promise.all([
          api.searchSchedules({ alpha: alphaDelay, beta: 1 - alphaDelay }),
          api.getStudentGroups(),
        ]);
        setCandidates(res.allCandidates);
        setRawCount(res.rawCombinationCount);
        setFeasibleCount(res.feasibleCount);
        setGroups(grps);
        const balanced = res.allCandidates.find((c) => c.tag === 'Balanced') || res.allCandidates[0];
        setSelectedCandidate(balanced);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [alphaDelay]);

  const handleSelectCandidate = (cand: CandidateSchedule) => {
    setSelectedCandidate(cand);
    setSelectedScheduleId(cand.id);
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (!a.isFeasible && b.isFeasible) return 1;
    if (a.isFeasible && !b.isFeasible) return -1;
    const factor = sortAsc ? 1 : -1;
    return (a[sortField] - b[sortField]) * factor;
  });

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Searching schedule combinatorial space...</div>;
  }

  // Prepare Pareto Plotly Scatter Data
  const paretoCandidates = candidates.filter((c) => c.isParetoOptimal && c.isFeasible);
  const nonParetoCandidates = candidates.filter((c) => !c.isParetoOptimal && c.isFeasible);
  const infeasibleCandidates = candidates.filter((c) => !c.isFeasible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 5: Schedule Search & Pareto Trade-Offs</h1>
            <EngineBadge engine="SUMO" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Balancing total vehicle congestion delay (J_delay) against student schedule disruption (J_disruption).
          </p>
        </div>

        {selectedCandidate && (
          <button
            type="button"
            onClick={() => navigate('/zones')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <span>Proceed to Step 6: Pickup Zones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Combinatorial Counter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <span className="text-[11px] text-slate-500">Raw Combinations (7^6)</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">
            {rawCount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            7 shift choices (-15 to +15m) across 6 student cohorts
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <span className="text-[11px] text-slate-500">Feasible Post-Hard Constraints</span>
          <div className="font-mono text-2xl font-bold text-emerald-700 mt-1">
            {feasibleCount} <span className="text-xs font-normal text-slate-500">schedules</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Enforcing pediatric KG floor and ±15m boundary
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Optional Objective Weighting</span>
            <span className="text-[10px] font-mono text-blue-700">
              α={(alphaDelay).toFixed(2)} / β={(1 - alphaDelay).toFixed(2)}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={alphaDelay}
              onChange={(e) => setAlphaDelay(parseFloat(e.target.value))}
              className="w-full accent-blue-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Prioritize Routine Comfort (β=1.0)</span>
              <span>Prioritize Free Flow (α=1.0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pareto Frontier Scatter Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Pareto Frontier: Congestion Delay vs Schedule Disruption"
            subtitle="Optimal candidates where delay cannot be reduced without increasing student schedule shift"
            source="Synthetic"
            engine="SUMO"
            formulaKey="disruption"
            height={320}
            data={[
              {
                x: paretoCandidates.map((c) => c.jDisruption),
                y: paretoCandidates.map((c) => c.jDelay),
                text: paretoCandidates.map((c) => `${c.name} (${c.peakQueue} veh)`),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Pareto Optimal Frontier',
                line: { color: '#1D4ED8', width: 2.5 },
                marker: { size: 9, color: '#1D4ED8' },
              },
              {
                x: nonParetoCandidates.map((c) => c.jDisruption),
                y: nonParetoCandidates.map((c) => c.jDelay),
                text: nonParetoCandidates.map((c) => c.name),
                type: 'scatter',
                mode: 'markers',
                name: 'Baseline / Suboptimal',
                marker: { size: 8, color: '#64748B', symbol: 'square' },
              },
              {
                x: infeasibleCandidates.map((c) => c.jDisruption),
                y: infeasibleCandidates.map((c) => c.jDelay),
                text: infeasibleCandidates.map((c) => `VIOLATION: ${c.name}`),
                type: 'scatter',
                mode: 'markers',
                name: 'Infeasible (Violates Hard Rule)',
                marker: { size: 8, color: '#DC2626', symbol: 'x' },
              },
            ]}
            layout={{
              yaxis: { title: { text: 'Vehicle Delay J_delay (veh-min)', font: { size: 10, color: '#64748B' } } },
              xaxis: { title: { text: 'Schedule Disruption J_disruption (student-min)', font: { size: 10, color: '#64748B' } } },
            }}
            footerNote="Lower-left corner represents ideal performance. Points on blue line cannot be dominated."
          />
        </div>

        {/* Selected Candidate Quick Inspector */}
        <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Selected Schedule Detail
              </span>
              {selectedCandidate && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    selectedCandidate.isFeasible
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedCandidate.tag}
                </span>
              )}
            </div>

            {selectedCandidate ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedCandidate.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="font-mono tabular-nums text-blue-700 font-semibold">
                      Peak Queue: {selectedCandidate.peakQueue} veh
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      P95 Wait: {selectedCandidate.waitP95} min
                    </span>
                  </div>
                </div>

                {!selectedCandidate.isFeasible && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{selectedCandidate.infeasibilityReason}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <div className="text-[11px] font-semibold text-slate-700 mb-2">Group Shift Offsets:</div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {groups.map((g) => {
                      const shift = selectedCandidate.offsetsPerGroup[g.id] ?? 0;
                      return (
                        <div key={g.id} className="flex items-center justify-between py-0.5 border-b border-slate-50 text-[11px]">
                          <span className="font-sans text-slate-600 truncate max-w-[150px]">{g.name}</span>
                          <span
                            className={`font-semibold tabular-nums ${
                              shift === 0
                                ? 'text-slate-500'
                                : shift > 0
                                ? 'text-blue-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {shift > 0 ? `+${shift}m` : `${shift}m`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-12 text-center">
                Select a candidate from the plot or table
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 block">
              Simulated delay reduction: <strong className="text-emerald-700 font-mono">
                {selectedCandidate?.simulatedReductionVsBaselinePct.toFixed(1)}% vs baseline
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sortable Candidate Table */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Evaluated Candidate Schedules Table</h2>
            <p className="text-xs text-slate-500">
              Click any row to inspect cohort timings or view downstream simulation runs
            </p>
          </div>
          <SourceBadge source="Synthetic" size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
              <tr>
                <th className="py-2.5 px-3">Candidate Schedule</th>
                <th className="py-2.5 px-3">Tag</th>
                <th
                  onClick={() => {
                    setSortField('jDelay');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-700"
                >
                  Delay J_delay (veh-min) ↕
                </th>
                <th
                  onClick={() => {
                    setSortField('jDisruption');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-700"
                >
                  Disruption J_disruption (stu-min) ↕
                </th>
                <th
                  onClick={() => {
                    setSortField('peakQueue');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-700"
                >
                  Peak Queue ↕
                </th>
                <th
                  onClick={() => {
                    setSortField('simulatedReductionVsBaselinePct');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-700"
                >
                  Simulated Reduction ↕
                </th>
                <th className="py-2.5 px-3">Feasibility Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCandidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;

                return (
                  <tr
                    key={cand.id}
                    onClick={() => handleSelectCandidate(cand)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 font-medium'
                        : 'hover:bg-blue-50/30'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cand.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cand.tag}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                      {cand.jDelay}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                      {cand.jDisruption}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900">
                      {cand.peakQueue} veh
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          cand.simulatedReductionVsBaselinePct > 0
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {cand.simulatedReductionVsBaselinePct > 0
                          ? `-${cand.simulatedReductionVsBaselinePct.toFixed(1)}%`
                          : '0.0%'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {cand.isFeasible ? (
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                          ✓ Feasible
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                          ✕ Infeasible
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCandidate(cand);
                          navigate('/zones');
                        }}
                        className="text-blue-700 hover:text-blue-900 font-semibold text-xs"
                      >
                        Select →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
