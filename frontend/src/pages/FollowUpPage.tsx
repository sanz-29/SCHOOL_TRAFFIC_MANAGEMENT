import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { GateObservation, VehicleType } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { EngineBadge } from '../components/EngineBadge';
import { ChartCard } from '../components/ChartCard';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Car,
  Clock,
  Info
} from 'lucide-react';

export const FollowUpPage: React.FC = () => {
  const [observations, setObservations] = useState<GateObservation[]>([]);
  const [selectedBin, setSelectedBin] = useState<string>('07:50 - 07:55');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');
  const [observedCount, setObservedCount] = useState<number>(14);
  const [expectedMin, setExpectedMin] = useState<number>(10);
  const [expectedMax, setExpectedMax] = useState<number>(16);
  const [recorderName, setRecorderName] = useState<string>('M. Selvam (Gate Marshal)');
  const [fieldNotes, setFieldNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const obs = await api.getGateObservations();
        setObservations(obs);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRecordCount = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await api.recordGateObservation({
      timeBin: selectedBin,
      vehicleType: selectedVehicleType,
      observedCount,
      predictedExpectedMin: expectedMin,
      predictedExpectedMax: expectedMax,
      recordedBy: recorderName,
      notes: fieldNotes,
    });
    setObservations([created, ...observations]);
    setSuccessMsg(
      created.isAnomaly
        ? `Count recorded: Marked as ANOMALY (Observed ${observedCount} falls outside expected ${expectedMin}-${expectedMax} range).`
        : `Count recorded: Within normal expected range (${expectedMin}-${expectedMax}).`
    );
    setTimeout(() => setSuccessMsg(null), 3500);
    setFieldNotes('');
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading follow-up records...</div>;
  }

  // Chart data: Observed vs Predicted
  const chartLabels = observations.map((o) => `${o.timeBin} (${o.vehicleType.substring(0, 4)})`);
  const observedValues = observations.map((o) => o.observedCount);
  const minExpectedValues = observations.map((o) => o.predictedExpectedMin);
  const maxExpectedValues = observations.map((o) => o.predictedExpectedMax);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 11: Gate-Side Follow-Up Measurement</h1>
            <SourceBadge source="Observed" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gate staff enter real-world post-implementation vehicle counts to compare observed throughput against model projections.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100 font-medium">
          Logged as: <strong className="text-blue-900">{recorderName}</strong>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Columns: Count Entry Form vs Observed vs Predicted Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Entry Form */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Enter Curbside Vehicle Count</h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
              FIELD ENTRY
            </span>
          </div>

          <form onSubmit={handleRecordCount} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Time Window Bin</label>
              <select
                value={selectedBin}
                onChange={(e) => setSelectedBin(e.target.value)}
                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-slate-800 bg-white font-mono"
              >
                <option value="07:35 - 07:40">07:35 - 07:40 AM</option>
                <option value="07:40 - 07:45">07:40 - 07:45 AM</option>
                <option value="07:45 - 07:50">07:45 - 07:50 AM</option>
                <option value="07:50 - 07:55">07:50 - 07:55 AM</option>
                <option value="07:55 - 08:00">07:55 - 08:00 AM</option>
                <option value="08:00 - 08:05">08:00 - 08:05 AM</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1">Vehicle Classification</label>
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value as VehicleType)}
                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-slate-800 bg-white capitalize"
              >
                <option value="car">Private Cars / SUVs</option>
                <option value="two_wheeler">Two-Wheelers (Motorcycles/Scooters)</option>
                <option value="auto_rickshaw">Auto-Rickshaws & Shared Autos</option>
                <option value="van">School Vans / Shuttles</option>
                <option value="school_bus">Contracted School Buses</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Observed Count</label>
                <input
                  type="number"
                  min={0}
                  value={observedCount}
                  onChange={(e) => setObservedCount(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-blue-300 rounded font-mono font-bold text-slate-900 bg-white text-center"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Pred. Min</label>
                <input
                  type="number"
                  min={0}
                  value={expectedMin}
                  onChange={(e) => setExpectedMin(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-slate-600 bg-white text-center"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Pred. Max</label>
                <input
                  type="number"
                  min={0}
                  value={expectedMax}
                  onChange={(e) => setExpectedMax(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-slate-600 bg-white text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1">Field Observation Notes</label>
              <input
                type="text"
                placeholder="e.g. Light drizzle; auto queue formed"
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-slate-800 bg-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Count Entry</span>
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Observed vs Predicted Plotly Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Observed Field Counts vs Predicted Calibration Confidence Interval"
            subtitle="Points falling outside the shaded envelope trigger automatic traffic anomaly alerts"
            source="Observed"
            engine="SUMO"
            height={300}
            data={[
              {
                x: chartLabels,
                y: maxExpectedValues,
                type: 'scatter',
                mode: 'lines',
                line: { width: 0 },
                showlegend: false,
                hoverinfo: 'skip',
              },
              {
                x: chartLabels,
                y: minExpectedValues,
                type: 'scatter',
                mode: 'lines',
                line: { width: 0 },
                fill: 'tonexty',
                fillcolor: 'rgba(219, 234, 254, 0.5)',
                name: 'Expected Tolerance Range',
              },
              {
                x: chartLabels,
                y: observedValues,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Actual Observed Gate Count',
                line: { color: '#1D4ED8', width: 2.5 },
                marker: { size: 8, color: '#1D4ED8' },
              },
            ]}
            layout={{
              yaxis: { title: { text: 'Vehicle Count', font: { size: 10, color: '#64748B' } } },
              xaxis: { tickfont: { size: 10 } },
            }}
            footerNote="Anomalies are flagged whenever observed counts breach upper or lower prediction bounds."
          />
        </div>
      </div>

      {/* Field Count Records Table */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recorded Gate Counts & Anomaly Audits</h3>
            <p className="text-xs text-slate-500">
              Field observations recorded by gate marshals and security teams
            </p>
          </div>
          <SourceBadge source="Observed" size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Vehicle Type</th>
                <th className="py-2.5 px-3">Observed Count</th>
                <th className="py-2.5 px-3">Predicted Expected Band</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {observations.map((obs) => (
                <tr
                  key={obs.id}
                  className={`transition-colors ${
                    obs.isAnomaly ? 'bg-amber-50/50' : 'hover:bg-blue-50/20'
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{obs.timestamp}</td>
                  <td className="py-2.5 px-3 text-slate-800">{obs.timeBin}</td>
                  <td className="py-2.5 px-3 font-sans capitalize text-slate-700">
                    {obs.vehicleType.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 text-sm">
                    {obs.observedCount} veh
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    [{obs.predictedExpectedMin} – {obs.predictedExpectedMax} veh]
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {obs.isAnomaly ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        ANOMALY
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                        ✓ Expected
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{obs.recordedBy}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px] max-w-xs truncate">
                    {obs.notes || '—'}
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
