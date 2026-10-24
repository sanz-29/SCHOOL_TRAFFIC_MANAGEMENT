import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { SimulationRun, SimulationEngine } from '../types';
import { RunInfoBar } from '../components/RunInfoBar';
import { EngineBadge } from '../components/EngineBadge';
import { SourceBadge } from '../components/SourceBadge';
import { ChartCard } from '../components/ChartCard';
import { FormulaTooltip } from '../components/FormulaTooltip';
import { KpiCard } from '../components/KpiCard';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

export const SimulationResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeEngine, setActiveEngine] = useState<SimulationEngine>('SUMO');
  const [simulationRun, setSimulationRun] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const run = await api.runSimulation('cand_balanced', activeEngine);
        setSimulationRun(run);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeEngine]);

  const candidatesComparison = [
    {
      name: 'Existing Schedule (Single Bell 07:50 AM)',
      staggerStrategy: '0 min (All 1,840 students arrive simultaneously)',
      peakQueue: 46,
      waitP95: 11.4,
      totalDelay: 1420,
      spillbackMin: 18.5,
      reductionPct: 0,
      engine: 'SUMO',
    },
    {
      name: 'Uniform Stagger (Equal 10-Minute Offsets)',
      staggerStrategy: 'Uniform +10m stagger without cohort weighting',
      peakQueue: 28,
      waitP95: 6.8,
      totalDelay: 860,
      spillbackMin: 7.0,
      reductionPct: 39.4,
      engine: 'SUMO',
    },
    {
      name: 'Plan Alpha: Minimal Routine Shift',
      staggerStrategy: 'Targeted ±5m to ±10m shift; sibling priority preserved',
      peakQueue: 24,
      waitP95: 5.8,
      totalDelay: 780,
      spillbackMin: 4.2,
      reductionPct: 45.1,
      engine: 'SUMO',
    },
    {
      name: 'Plan Beta: Balanced Stagger (Recommended)',
      staggerStrategy: 'Optimal Pareto balance; bus loop decoupling (Zone B)',
      peakQueue: 14,
      waitP95: 3.4,
      totalDelay: 510,
      spillbackMin: 0.0,
      reductionPct: 64.1,
      engine: 'SUMO',
      isRecommended: true,
    },
    {
      name: 'Plan Gamma: Maximum Delay Reduction',
      staggerStrategy: 'Aggressive ±15m stagger; highest schedule disruption',
      peakQueue: 9,
      waitP95: 2.1,
      totalDelay: 390,
      spillbackMin: 0.0,
      reductionPct: 72.5,
      engine: 'SUMO',
    },
  ];

  if (loading || !simulationRun) {
    return <div className="p-8 text-center text-xs text-slate-500">Executing simulation engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 7: High-Fidelity Simulation Evaluation</h1>
            <EngineBadge engine={activeEngine} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparing Existing baseline vs Uniform Stagger vs GateFlow Pareto candidates under SUMO micro-simulation.
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-blue-50/80 rounded-lg border border-blue-100 text-xs">
            {(['SUMO', 'Fast model'] as SimulationEngine[]).map((eng) => (
              <button
                key={eng}
                type="button"
                onClick={() => setActiveEngine(eng)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  activeEngine === eng
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {eng}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/stress-tests')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <span>Step 8: Stress Tests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Global Run Info Bar */}
      <RunInfoBar
        scenarioName="Morning Peak Simulation — Plan Beta Comparison"
        seed={simulationRun.seed}
        modelVersion={simulationRun.modelVersion}
        engine={activeEngine}
        timestamp={simulationRun.simulatedTimestamp}
      />

      {/* Prominent Mismatch Banner (SUMO vs Fast Model) */}
      {simulationRun.mismatchWithSumo?.hasMismatch && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-xs shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900">
                Engine Discrepancy Detected (Micro-Simulation Authoritative)
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                SUMO WINS
              </span>
            </div>
            <p className="text-amber-800 mt-1">
              {simulationRun.mismatchWithSumo.differenceDescription}
            </p>
            <div className="mt-2 text-[11px] text-amber-900 font-semibold">
              Authoritative Decision Rule: SUMO micro-simulation accounts for turning radii, road geometry friction, and bus acceleration dynamics. SUMO output must always govern final principal sign-off.
            </div>
          </div>
        </div>
      )}

      {/* Standardized Metrics Comparison Table */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Standardized Metrics Comparison (Existing vs Uniform vs Candidates)
            </h2>
            <p className="text-xs text-slate-500">
              All scenarios simulated under identical demand, vehicle mix, and stop-duration distributions
            </p>
          </div>
          <SourceBadge source="Synthetic" size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
              <tr>
                <th className="py-2.5 px-3">Operational Strategy</th>
                <th className="py-2.5 px-3">Timing Shift Mechanism</th>
                <th className="py-2.5 px-3">Peak Queue</th>
                <th className="py-2.5 px-3">P95 Wait</th>
                <th className="py-2.5 px-3">Total Delay (J_delay)</th>
                <th className="py-2.5 px-3">Spillback Minutes</th>
                <th className="py-2.5 px-3 font-semibold text-slate-900">Simulated Change vs Baseline</th>
                <th className="py-2.5 px-3">Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {candidatesComparison.map((cand) => (
                <tr
                  key={cand.name}
                  className={`transition-colors ${
                    cand.isRecommended
                      ? 'bg-blue-50/70 font-semibold'
                      : 'hover:bg-blue-50/30 font-normal'
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{cand.name}</span>
                      {cand.isRecommended && (
                        <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.2 rounded font-sans font-bold">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                    {cand.staggerStrategy}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-900">
                    {cand.peakQueue} veh
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-800">
                    {cand.waitP95} min
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-800">
                    {cand.totalDelay} veh-min
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-800">
                    {cand.spillbackMin === 0 ? (
                      <span className="text-emerald-700 font-semibold">0.0 min (None)</span>
                    ) : (
                      <span className="text-rose-600">{cand.spillbackMin} min</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-bold">
                    <span
                      className={
                        cand.reductionPct > 0 ? 'text-emerald-700' : 'text-slate-500'
                      }
                    >
                      {cand.reductionPct > 0 ? `-${cand.reductionPct.toFixed(1)}%` : '0.0% (Baseline)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold">
                      {cand.engine}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Charts: Queue-Over-Time and Wait Distribution Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Curbside Queue Profile: Existing vs Plan Beta (SUMO)"
          subtitle="Showing complete eradication of the 18.5-minute arterial spillback"
          source="Synthetic"
          engine="SUMO"
          formulaKey="delay"
          height={280}
          data={[
            {
              x: simulationRun.timeSeries.map((t) => t.time),
              y: simulationRun.timeSeries.map((t) => t.queueExisting),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Existing Schedule (46 Peak Queue)',
              line: { color: '#64748B', width: 2, dash: 'dot' },
              marker: { size: 5, color: '#64748B' },
            },
            {
              x: simulationRun.timeSeries.map((t) => t.time),
              y: simulationRun.timeSeries.map((t) => t.queueCandidate),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Plan Beta Stagger (14 Peak Queue)',
              line: { color: '#1D4ED8', width: 3 },
              marker: { size: 6, color: '#1D4ED8' },
            },
            {
              x: simulationRun.timeSeries.map((t) => t.time),
              y: simulationRun.timeSeries.map((t) => t.spillbackThreshold),
              type: 'scatter',
              mode: 'lines',
              name: 'Gate Bay Capacity Limit (8 veh)',
              line: { color: '#DC2626', width: 1.5, dash: 'dash' },
            },
          ]}
          layout={{
            yaxis: { title: { text: 'Vehicles Queueing', font: { size: 10, color: '#64748B' } } },
            xaxis: { title: { text: 'Time (Morning Peak)', font: { size: 10, color: '#64748B' } } },
          }}
          footerNote="Plan Beta peak occurs at 07:51 with 14 vehicles, quickly clearing within 3 minutes."
        />

        <ChartCard
          title="Vehicle Wait-Time Shift (Distribution Comparison)"
          subtitle="Proportion of arrivals waiting in each duration bracket"
          source="Synthetic"
          engine="SUMO"
          formulaKey="delay"
          height={280}
          data={[
            {
              x: simulationRun.waitDistribution.map((w) => w.waitRange),
              y: simulationRun.waitDistribution.map((w) => w.existingPct),
              type: 'bar',
              name: 'Existing Single Bell (%)',
              marker: { color: '#64748B' },
            },
            {
              x: simulationRun.waitDistribution.map((w) => w.waitRange),
              y: simulationRun.waitDistribution.map((w) => w.candidatePct),
              type: 'bar',
              name: 'Plan Beta Stagger (%)',
              marker: { color: '#1D4ED8' },
            },
          ]}
          layout={{
            yaxis: { title: { text: 'Arrival Percentage (%)', font: { size: 10, color: '#64748B' } } },
            xaxis: { title: { text: 'Wait Time Bracket', font: { size: 10, color: '#64748B' } } },
            barmode: 'group',
          }}
          footerNote="90% of vehicles under Plan Beta clear the school bay in under 4 minutes."
        />
      </div>
    </div>
  );
};
