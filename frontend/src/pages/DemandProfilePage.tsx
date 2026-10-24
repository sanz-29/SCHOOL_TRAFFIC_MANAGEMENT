import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DemandProfile, DataSource, VehicleType } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { ChartCard } from '../components/ChartCard';
import { FormulaTooltip } from '../components/FormulaTooltip';
import { Save, CheckCircle2, RotateCcw, AlertCircle, Info, Sparkles } from 'lucide-react';

export const DemandProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<DemandProfile | null>(null);
  const [selectedSource, setSelectedSource] = useState<DataSource>('Synthetic');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const d = await api.getDemandProfile();
        setProfile(d);
        setSelectedSource(d.source);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSourceChange = (newSource: DataSource) => {
    setSelectedSource(newSource);
    if (profile) {
      setProfile({ ...profile, source: newSource });
    }
  };

  const handleBinArrivalChange = (
    binIndex: number,
    field: 'twoWheelerArrivals' | 'carArrivals' | 'autoArrivals' | 'vanArrivals' | 'busArrivals',
    val: number
  ) => {
    if (!profile) return;
    const updatedBins = [...profile.bins];
    const bin = { ...updatedBins[binIndex], [field]: Math.max(0, val) };
    bin.totalVehicles =
      bin.twoWheelerArrivals +
      bin.carArrivals +
      bin.autoArrivals +
      bin.vanArrivals +
      bin.busArrivals;
    updatedBins[binIndex] = bin;
    setProfile({ ...profile, bins: updatedBins });
  };

  const handleDwellChange = (
    index: number,
    field: 'minSeconds' | 'typicalSeconds' | 'maxSeconds',
    val: number
  ) => {
    if (!profile) return;
    const updatedDwells = [...profile.dwellDistributions];
    updatedDwells[index] = { ...updatedDwells[index], [field]: Math.max(1, val) };
    setProfile({ ...profile, dwellDistributions: updatedDwells });
  };

  const handleSave = async () => {
    if (!profile) return;
    await api.updateDemandProfile({ ...profile, source: selectedSource });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  if (loading || !profile) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading demand profiles...</div>;
  }

  // Calculate arrival chart data with uncertainty bands
  const xTimes = profile.bins.map((b) => b.startTime);
  const totalArrivals = profile.bins.map((b) => b.totalVehicles);
  const uncertaintyFactor = profile.uncertaintyBandPct / 100;
  const upperBand = totalArrivals.map((v) => Math.round(v * (1 + uncertaintyFactor)));
  const lowerBand = totalArrivals.map((v) => Math.round(v * (1 - uncertaintyFactor)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 2: Peak Arrival Demand & Dwell Times</h1>
            <SourceBadge source={selectedSource} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Specify arrival volume per 5-minute slice and stopping duration distributions for simulation intake.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Demand Saved' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Source Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-900">Data Origin & Provenance</div>
          <div className="text-[11px] text-slate-500">
            Source classification determines confidence bands in all downstream simulation runs.
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-blue-50/80 rounded-lg border border-blue-100 self-start sm:self-auto">
          {(['Observed', 'Synthetic', 'Assumed'] as DataSource[]).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => handleSourceChange(src)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedSource === src
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {src === 'Observed'
                ? 'Manual Observation'
                : src === 'Synthetic'
                ? 'Synthetic Dataset'
                : 'Regional Assumptions'}
            </button>
          ))}
        </div>
      </div>

      {/* Arrival Rate Chart with Uncertainty Band */}
      <ChartCard
        title="Arrival Rate Time-Series with ±14% Calibration Uncertainty Band"
        subtitle="Aggregate vehicles arriving at school cordon per 5-minute observation bin"
        source={selectedSource}
        height={280}
        data={[
          {
            x: xTimes,
            y: upperBand,
            type: 'scatter',
            mode: 'lines',
            line: { width: 0 },
            name: '+14% Upper Bound',
            showlegend: false,
            hoverinfo: 'skip',
          },
          {
            x: xTimes,
            y: lowerBand,
            type: 'scatter',
            mode: 'lines',
            line: { width: 0 },
            fill: 'tonexty',
            fillcolor: 'rgba(219, 234, 254, 0.45)', // soft light blue
            name: 'Uncertainty Band (±14%)',
          },
          {
            x: xTimes,
            y: totalArrivals,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Expected Inflow (Vehicles / 5-min)',
            line: { color: '#1D4ED8', width: 3 },
            marker: { size: 7, color: '#1D4ED8' },
          },
        ]}
        layout={{
          yaxis: { title: { text: 'Inflow (Vehicles / 5-min)', font: { size: 10, color: '#64748B' } } },
          xaxis: { title: { text: 'Time Slice (Morning Peak)', font: { size: 10, color: '#64748B' } } },
        }}
        footerNote="Uncertainty band models driver punctuality variations, rain friction, and traffic signal batching."
      />

      {/* Entry Grid: Four 5-Minute Bins per Vehicle Type */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Vehicle Arrival Grid (4 × 5-Minute Peak Bins)</h2>
            <p className="text-xs text-slate-500">
              Directly input vehicle counts arriving at school gate cordon per time slot
            </p>
          </div>
          <SourceBadge source={selectedSource} size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
              <tr>
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Two-Wheelers</th>
                <th className="py-2.5 px-3">Cars / SUVs</th>
                <th className="py-2.5 px-3">Auto-Rickshaws</th>
                <th className="py-2.5 px-3">School Vans</th>
                <th className="py-2.5 px-3">School Buses</th>
                <th className="py-2.5 px-3 font-semibold text-slate-900">Total Vehicles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {profile.bins.map((bin, idx) => (
                <tr key={bin.binLabel} className="hover:bg-blue-50/30">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                    {bin.binLabel}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={bin.twoWheelerArrivals}
                      onChange={(e) =>
                        handleBinArrivalChange(idx, 'twoWheelerArrivals', parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-slate-800 bg-white"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={bin.carArrivals}
                      onChange={(e) =>
                        handleBinArrivalChange(idx, 'carArrivals', parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-slate-800 bg-white"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={bin.autoArrivals}
                      onChange={(e) =>
                        handleBinArrivalChange(idx, 'autoArrivals', parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-slate-800 bg-white"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={bin.vanArrivals}
                      onChange={(e) =>
                        handleBinArrivalChange(idx, 'vanArrivals', parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-slate-800 bg-white"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={bin.busArrivals}
                      onChange={(e) =>
                        handleBinArrivalChange(idx, 'busArrivals', parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-slate-800 bg-white"
                    />
                  </td>
                  <td className="py-2 px-3 font-bold text-blue-700 text-sm">
                    {bin.totalVehicles} veh
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stopping-Duration Dwell Samples */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Stopping-Duration Dwell Samples (Seconds)</h2>
            <p className="text-xs text-slate-500">
              Kerbside dwell time parameters (minimum quick drop, typical average, and maximum delayed unload)
            </p>
          </div>
          <FormulaTooltip formulaKey="delay" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {profile.dwellDistributions.map((item, idx) => (
            <div key={item.vehicleType} className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-xs">
              <div className="font-semibold text-slate-900 mb-2 capitalize">
                {item.vehicleType.replace('_', ' ')}
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans text-slate-500">Min:</span>
                  <input
                    type="number"
                    value={item.minSeconds}
                    onChange={(e) => handleDwellChange(idx, 'minSeconds', parseInt(e.target.value) || 1)}
                    className="w-14 px-1.5 py-0.5 text-center text-xs border border-blue-200 rounded bg-white"
                  />
                  <span className="text-[10px] text-slate-400">s</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-blue-900">
                  <span className="text-[11px] font-sans text-slate-700">Typical:</span>
                  <input
                    type="number"
                    value={item.typicalSeconds}
                    onChange={(e) => handleDwellChange(idx, 'typicalSeconds', parseInt(e.target.value) || 1)}
                    className="w-14 px-1.5 py-0.5 text-center text-xs border border-blue-300 rounded bg-white text-blue-700 font-bold"
                  />
                  <span className="text-[10px] text-blue-500">s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans text-slate-500">Max:</span>
                  <input
                    type="number"
                    value={item.maxSeconds}
                    onChange={(e) => handleDwellChange(idx, 'maxSeconds', parseInt(e.target.value) || 1)}
                    className="w-14 px-1.5 py-0.5 text-center text-xs border border-blue-200 rounded bg-white"
                  />
                  <span className="text-[10px] text-slate-400">s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
