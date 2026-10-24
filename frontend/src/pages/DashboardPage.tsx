import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { School, SimulationRun, CandidateSchedule } from '../types';
import { KpiCard } from '../components/KpiCard';
import { RunInfoBar } from '../components/RunInfoBar';
import { SourceBadge } from '../components/SourceBadge';
import { EngineBadge } from '../components/EngineBadge';
import { ChartCard } from '../components/ChartCard';
import { WORKFLOW_STEPS } from '../components/StepperNav';
import {
  Car,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  PlayCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [baselineRun, setBaselineRun] = useState<SimulationRun | null>(null);
  const [activeRun, setActiveRun] = useState<SimulationRun | null>(null);
  const [candidates, setCandidates] = useState<CandidateSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sch, base, sim, candRes] = await Promise.all([
          api.getSchool(),
          api.getBaselineDiagnosis(),
          api.runSimulation('cand_balanced', 'SUMO'),
          api.searchSchedules(),
        ]);
        setSchool(sch);
        setBaselineRun(base);
        setActiveRun(sim);
        setCandidates(candRes.allCandidates);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Scenario Summary & Run Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-blue-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {school ? school.name : "St. Jude's Higher Secondary School"}
            </h1>
            <SourceBadge source="Observed" size="sm" />
          </div>
          <p className="text-xs text-slate-500">
            {school?.address} · Single Main Gate · {school?.studentCountTotal} Students · Gate Bay Capacity: {school?.gateSideCapacity} Vehicles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/baseline')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <PlayCircle className="w-4 h-4 text-blue-600" />
            <span>Replay Baseline</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/approve')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <FileCheck className="w-4 h-4" />
            <span>Compare & Approve</span>
          </button>
        </div>
      </div>

      {/* Global Run Info Bar */}
      <RunInfoBar
        scenarioName="Morning Rush Peak (07:45 - 08:15) — Single Bell vs Balanced Stagger"
        seed={48291}
        modelVersion="SUMO-v1.18-SchoolGate"
        engine="SUMO"
        timestamp="2026-10-24 07:45 - 08:15"
      />

      {/* 5 Baseline KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Baseline Traffic Diagnosis (Current Single Bell at 07:50 AM)
          </h2>
          <span className="text-[11px] text-slate-500">
            Simulated vs Plan Beta Candidate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <KpiCard
            label="Peak Queue Length"
            value={baselineRun?.metrics.peakQueueVehicles ?? 46}
            unit="vehicles"
            baselineValue={46}
            simulatedChangePct={activeRun ? activeRun.metrics.simulatedReductionVsBaselinePct : -64.1}
            source="Observed"
            formulaKey="simulated_change"
            status={baselineRun && baselineRun.metrics.peakQueueVehicles > 20 ? 'alert' : 'normal'}
            subtitle="Spills beyond 8-vehicle gate bay"
          />

          <KpiCard
            label="95th Percentile Wait"
            value={baselineRun?.metrics.waitP95Minutes ?? 11.4}
            unit="minutes"
            baselineValue={11.4}
            simulatedChangePct={70.2}
            source="Observed"
            formulaKey="delay"
            status="warning"
            subtitle="Plan Beta reduces to 3.4 min"
          />

          <KpiCard
            label="Total Vehicle Delay (J_delay)"
            value={baselineRun?.metrics.totalDelayVehicleMinutes ?? 1420}
            unit="veh-min"
            baselineValue={1420}
            simulatedChangePct={64.1}
            source="Observed"
            formulaKey="delay"
            status="alert"
            subtitle="Sum of idling vehicles over peak"
          />

          <KpiCard
            label="Spillback Duration"
            value={baselineRun?.metrics.spillbackMinutes ?? 18.5}
            unit="minutes"
            baselineValue={18.5}
            simulatedChangePct={100}
            source="Observed"
            formulaKey="capacity"
            status="alert"
            subtitle="Arterial road blocked for 18.5 min"
          />

          <KpiCard
            label="Zone Capacity Violations"
            value={baselineRun?.metrics.zoneViolations ?? 0}
            unit="incidents"
            baselineValue={0}
            simulatedChangePct={0}
            source="Observed"
            formulaKey="capacity"
            status="normal"
            subtitle="Within verified stopping bays"
          />
        </div>
      </div>

      {/* Main Grid: Workflow Stepper Progress & Queue Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Queue Evolution Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Gate Queue Comparison: Existing Single Bell vs Plan Beta Stagger"
            subtitle="Vehicles queueing on school frontage during peak morning arrival (07:35 - 08:15)"
            source="Synthetic"
            engine="SUMO"
            formulaKey="delay"
            height={290}
            data={[
              {
                x: activeRun?.timeSeries.map((t) => t.time) ?? [],
                y: activeRun?.timeSeries.map((t) => t.queueExisting) ?? [],
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Existing Schedule (07:50 Single Bell)',
                line: { color: '#64748B', width: 2.5, dash: 'dot' },
                marker: { size: 5, color: '#64748B' },
              },
              {
                x: activeRun?.timeSeries.map((t) => t.time) ?? [],
                y: activeRun?.timeSeries.map((t) => t.queueCandidate) ?? [],
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Plan Beta Stagger (GateFlow Simulated)',
                line: { color: '#1D4ED8', width: 3 },
                marker: { size: 6, color: '#1D4ED8' },
              },
              {
                x: activeRun?.timeSeries.map((t) => t.time) ?? [],
                y: activeRun?.timeSeries.map((t) => t.spillbackThreshold) ?? [],
                type: 'scatter',
                mode: 'lines',
                name: 'Gate Bay Capacity (8 veh threshold)',
                line: { color: '#DC2626', width: 1.5, dash: 'dash' },
              },
            ]}
            layout={{
              yaxis: { title: { text: 'Queue (Vehicles)', font: { size: 10, color: '#64748B' } } },
              xaxis: { title: { text: 'Time of Day', font: { size: 10, color: '#64748B' } } },
            }}
            footerNote="Spillback occurs when queue exceeds 8 vehicles, blocking through-traffic on Arcot Road."
          />
        </div>

        {/* Right Col: Workflow Stepper Progress Card */}
        <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Planning Workflow Progress</h2>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Step 3 of 10
              </span>
            </div>

            <div className="py-3 space-y-2">
              {WORKFLOW_STEPS.slice(0, 6).map((step, idx) => (
                <div
                  key={step.stepNumber}
                  onClick={() => navigate(step.path)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/70 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono flex items-center justify-center font-bold">
                      {step.stepNumber}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-slate-800 group-hover:text-blue-700">
                        {step.label}
                      </div>
                      <div className="text-[10px] text-slate-400">{step.description}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/constraints')}
            className="w-full mt-2 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Step 4: Constraints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Simulation Runs Table */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Evaluated Candidate Schedules</h3>
            <p className="text-xs text-slate-500">
              Pareto optimal and baseline solutions generated from 117,649 permutations
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            Open Trade-Off Explorer →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
              <tr>
                <th className="py-2.5 px-3">Candidate Plan</th>
                <th className="py-2.5 px-3">Tag / Classification</th>
                <th className="py-2.5 px-3">Total Delay (J_delay)</th>
                <th className="py-2.5 px-3">Disruption (J_disruption)</th>
                <th className="py-2.5 px-3">Peak Queue</th>
                <th className="py-2.5 px-3">P95 Wait</th>
                <th className="py-2.5 px-3">Simulated Reduction</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {candidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {cand.name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        cand.tag === 'Balanced'
                          ? 'bg-blue-100 text-blue-800'
                          : cand.tag === 'Minimal change'
                          ? 'bg-sky-50 text-sky-800'
                          : cand.tag === 'Infeasible'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cand.tag}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                    {cand.jDelay} veh-min
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                    {cand.jDisruption} stu-min
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900">
                    {cand.peakQueue} veh
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                    {cand.waitP95} min
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-semibold font-mono tabular-nums ${
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
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/simulation')}
                      className="text-blue-700 hover:text-blue-900 font-medium text-xs"
                    >
                      View Run →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
