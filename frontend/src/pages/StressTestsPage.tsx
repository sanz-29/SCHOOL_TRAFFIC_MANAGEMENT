import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { StressScenarioResult } from '../types';
import { EngineBadge } from '../components/EngineBadge';
import { SourceBadge } from '../components/SourceBadge';
import { ChartCard } from '../components/ChartCard';
import { FormulaTooltip } from '../components/FormulaTooltip';
import { RunInfoBar } from '../components/RunInfoBar';
import {
  Flame,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Info,
  CheckCircle2
} from 'lucide-react';

export const StressTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [stressMatrix, setStressMatrix] = useState<StressScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const matrix = await api.getStressTests();
        setStressMatrix(matrix);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Evaluating robustness matrix...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 8: Robustness Stress-Testing Matrix</h1>
            <EngineBadge engine="SUMO" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Subjecting candidate Plan Beta to adverse real-world perturbations: vehicle surges, extended stop durations, and low compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/approve')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
        >
          <span>Step 9: Compare & Approve Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Run Info Bar */}
      <RunInfoBar
        scenarioName="Monte Carlo Stress Tests (100 Seeds) — Plan Beta Robustness"
        seed={48291}
        modelVersion="SUMO-v1.18-StressEngine"
        engine="SUMO"
      />

      {/* Fragility Alert Callout */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900">Operational Fragility Warning:</span>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Plan Beta remains resilient under a +30% rainy-day surge, but becomes highly fragile when parent compliance falls below 70%. When 40% of parents ignore the staggered windows, the single-bell peak clustering recurs. Clear parent communication is mandatory before launching.
          </p>
        </div>
      </div>

      {/* 4x Stress Test Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stressMatrix.map((item) => (
          <div
            key={item.conditionId}
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs ${
              item.isFragile
                ? 'bg-white border-amber-300 ring-1 ring-amber-400/30'
                : 'bg-white border-blue-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-bold text-slate-900 text-xs">{item.conditionName}</span>
                {item.isFragile ? (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                    FRAGILE
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                    STABLE
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                {item.description}
              </p>

              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-slate-500 text-[11px]">Mean Queue:</span>
                  <span className="font-bold text-slate-900">{item.meanQueue.toFixed(1)} veh</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-slate-500 text-[11px]">P95 Wait Time:</span>
                  <span className="text-slate-800">{item.p95Wait.toFixed(1)} min</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="font-sans text-slate-700 text-[11px]">Worst-Case Queue:</span>
                  <span
                    className={`tabular-nums ${
                      item.worstCaseQueue > 25 ? 'text-rose-600' : 'text-blue-700'
                    }`}
                  >
                    {item.worstCaseQueue} veh
                  </span>
                </div>
              </div>
            </div>

            {item.fragilityReason && (
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-amber-800 font-medium">
                ⚠️ {item.fragilityReason}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Chart: Queue Lengths across Stress Conditions */}
      <ChartCard
        title="Worst-Case vs Mean Queue Comparison Across Stress Scenarios"
        subtitle="Simulated in SUMO across 100 stochastic arrival seeds per condition"
        source="Synthetic"
        engine="SUMO"
        formulaKey="delay"
        height={300}
        data={[
          {
            x: stressMatrix.map((s) => s.conditionName),
            y: stressMatrix.map((s) => s.meanQueue),
            type: 'bar',
            name: 'Mean Simulated Queue (Vehicles)',
            marker: { color: '#60A5FA' },
          },
          {
            x: stressMatrix.map((s) => s.conditionName),
            y: stressMatrix.map((s) => s.worstCaseQueue),
            type: 'bar',
            name: 'Worst-Case Peak Queue (Vehicles)',
            marker: { color: '#1D4ED8' },
          },
          {
            x: stressMatrix.map((s) => s.conditionName),
            y: [8, 8, 8, 8],
            type: 'scatter',
            mode: 'lines',
            name: 'Gate Bay Capacity Limit (8 veh)',
            line: { color: '#DC2626', width: 2, dash: 'dash' },
          },
        ]}
        layout={{
          yaxis: { title: { text: 'Queue (Vehicles)', font: { size: 10, color: '#64748B' } } },
          xaxis: { tickfont: { size: 10 } },
          barmode: 'group',
        }}
        footerNote="Spillback occurs whenever the worst-case bar exceeds the red dashed capacity line (8 vehicles)."
      />
    </div>
  );
};
