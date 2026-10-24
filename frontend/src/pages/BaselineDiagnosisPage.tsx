import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { SimulationRun } from '../types';
import { KpiCard } from '../components/KpiCard';
import { RunInfoBar } from '../components/RunInfoBar';
import { ChartCard } from '../components/ChartCard';
import { SourceBadge } from '../components/SourceBadge';
import { EngineBadge } from '../components/EngineBadge';
import { FormulaTooltip } from '../components/FormulaTooltip';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Car,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const BaselineDiagnosisPage: React.FC = () => {
  const [baselineRun, setBaselineRun] = useState<SimulationRun | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const run = await api.getBaselineDiagnosis();
        setBaselineRun(run);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Animation loop for simulation replay scrubber
  useEffect(() => {
    if (!isPlaying || !baselineRun) return;

    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= baselineRun.timeSeries.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, baselineRun]);

  if (loading || !baselineRun) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading baseline diagnosis...</div>;
  }

  const currentPoint = baselineRun.timeSeries[replayIndex] || baselineRun.timeSeries[0];
  const isSpillback = currentPoint.queueExisting > currentPoint.spillbackThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 3: Baseline Diagnosis (Single Bell 07:50 AM)</h1>
            <SourceBadge source="Observed" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulating current operational bottleneck where all 1,840 students arrive for a single 07:50 AM school bell.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <EngineBadge engine={baselineRun.engine} />
        </div>
      </div>

      {/* Run Info Bar */}
      <RunInfoBar
        scenarioName="Morning Baseline — Calibrated Field Conditions"
        seed={baselineRun.seed}
        modelVersion={baselineRun.modelVersion}
        engine={baselineRun.engine}
        timestamp={baselineRun.simulatedTimestamp}
      />

      {/* Baseline KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Peak Queue Length"
          value={baselineRun.metrics.peakQueueVehicles}
          unit="vehicles"
          baselineValue={46}
          source="Observed"
          formulaKey="delay"
          status="alert"
          subtitle="Bay holds 8 vehicles; 38 spilled onto road"
        />

        <KpiCard
          label="95th Percentile Wait Time"
          value={baselineRun.metrics.waitP95Minutes}
          unit="minutes"
          baselineValue={11.4}
          source="Observed"
          formulaKey="delay"
          status="warning"
          subtitle="Maximum vehicle idling curbside"
        />

        <KpiCard
          label="Total Vehicle Delay (J_delay)"
          value={baselineRun.metrics.totalDelayVehicleMinutes}
          unit="veh-min"
          baselineValue={1420}
          source="Observed"
          formulaKey="delay"
          status="alert"
          subtitle="Cumulative delay sum Q_t × dt"
        />

        <KpiCard
          label="Road Spillback Duration"
          value={baselineRun.metrics.spillbackMinutes}
          unit="minutes"
          baselineValue={18.5}
          source="Observed"
          formulaKey="capacity"
          status="alert"
          subtitle="Through traffic completely blocked"
        />
      </div>

      {/* Interactive Simulation Replay Scrubber Area */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Simulation Replay Scrubber</h2>
              <EngineBadge engine="SUMO" />
            </div>
            <p className="text-xs text-slate-500">
              Scrub through the 07:40 - 08:10 arrival window to inspect queue formation and spillback
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setReplayIndex(0);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
              title="Reset scrubber to start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Scrubber State Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
          <div>
            <span className="text-[11px] text-slate-500">Simulated Clock</span>
            <div className="font-mono text-base font-bold text-blue-900">{currentPoint.time} AM</div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500">Active Queue</span>
            <div className="font-mono text-base font-bold text-slate-900">
              {currentPoint.queueExisting} <span className="text-xs font-normal">vehicles</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500">Gate Bay Status</span>
            <div className="font-medium text-xs mt-0.5">
              {isSpillback ? (
                <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Spillback (+{currentPoint.queueExisting - currentPoint.spillbackThreshold} veh on road)
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">Within Bay (&lt; 8 veh)</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500">Vehicular Inflow Rate</span>
            <div className="font-mono text-base font-bold text-slate-900">
              {currentPoint.inflowRate} <span className="text-xs font-normal">veh / min</span>
            </div>
          </div>
        </div>

        {/* Timeline Slider Control */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>07:40 AM (Free Flow)</span>
            <span className="text-blue-700 font-semibold">Current: {currentPoint.time} AM</span>
            <span>08:10 AM (Queue Cleared)</span>
          </div>
          <input
            type="range"
            min={0}
            max={baselineRun.timeSeries.length - 1}
            value={replayIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setReplayIndex(parseInt(e.target.value));
            }}
            className="w-full accent-blue-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Two Charts Grid: Queue Over Time & Wait-Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Queue Over Time */}
        <ChartCard
          title="Baseline Queue Length vs Gate Bay Capacity"
          subtitle="Vehicular queue evolution showing 18.5 minutes of active road spillback"
          source="Observed"
          engine="SUMO"
          formulaKey="delay"
          height={280}
          data={[
            {
              x: baselineRun.timeSeries.map((t) => t.time),
              y: baselineRun.timeSeries.map((t) => t.queueExisting),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Queue Length (Vehicles)',
              line: { color: '#DC2626', width: 2.5 },
              marker: { size: 6, color: '#DC2626' },
            },
            {
              x: baselineRun.timeSeries.map((t) => t.time),
              y: baselineRun.timeSeries.map((t) => t.spillbackThreshold),
              type: 'scatter',
              mode: 'lines',
              name: 'Curbside Bay Limit (8 veh)',
              line: { color: '#64748B', width: 1.5, dash: 'dash' },
            },
          ]}
          layout={{
            yaxis: { title: { text: 'Queue (Vehicles)', font: { size: 10, color: '#64748B' } } },
            xaxis: { title: { text: 'Time of Day', font: { size: 10, color: '#64748B' } } },
          }}
          footerNote="Red line above 8 represents vehicles blocked on live traffic lane."
        />

        {/* Chart 2: Wait Time Distribution */}
        <ChartCard
          title="Curbside Wait-Time Distribution"
          subtitle="Percentage of drop-off vehicles experiencing delays under baseline single bell"
          source="Observed"
          engine="SUMO"
          formulaKey="delay"
          height={280}
          data={[
            {
              x: baselineRun.waitDistribution.map((w) => w.waitRange),
              y: baselineRun.waitDistribution.map((w) => w.existingPct),
              type: 'bar',
              name: 'Baseline Percentage (%)',
              marker: { color: '#64748B' },
            },
          ]}
          layout={{
            yaxis: { title: { text: 'Share of Arrivals (%)', font: { size: 10, color: '#64748B' } } },
            xaxis: { title: { text: 'Wait Time Bracket', font: { size: 10, color: '#64748B' } } },
          }}
          footerNote="Over 36% of vehicles wait longer than 7 minutes to drop off their child."
        />
      </div>
    </div>
  );
};
