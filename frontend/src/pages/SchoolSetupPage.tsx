import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { School, StudentGroup, VehicleMixItem, PickupZone } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { ZoneMapCard } from '../components/ZoneMapCard';
import { FormulaTooltip } from '../components/FormulaTooltip';
import {
  Building2,
  Users,
  Car,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Clock
} from 'lucide-react';

export const SchoolSetupPage: React.FC = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [vehicleMix, setVehicleMix] = useState<VehicleMixItem[]>([]);
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone_a');
  const [isSaved, setIsSaved] = useState(false);
  const [mixError, setMixError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [s, g, v, z] = await Promise.all([
        api.getSchool(),
        api.getStudentGroups(),
        api.getVehicleMix(),
        api.getPickupZones(),
      ]);
      setSchool(s);
      setGroups(g);
      setVehicleMix(v);
      setZones(z);
    }
    load();
  }, []);

  const totalVehicleMixPct = vehicleMix.reduce((acc, curr) => acc + curr.percentage, 0);

  const handleMixChange = (index: number, val: number) => {
    const updated = [...vehicleMix];
    updated[index].percentage = Math.max(0, Math.min(100, val));
    setVehicleMix(updated);

    const sum = updated.reduce((acc, curr) => acc + curr.percentage, 0);
    if (sum !== 100) {
      setMixError(`Total mix must equal 100%. Currently: ${sum}% (${sum > 100 ? `+${sum - 100}% over` : `${100 - sum}% remaining`})`);
    } else {
      setMixError(null);
    }
  };

  const handleGroupShiftChange = (id: string, minShift: number, maxShift: number) => {
    setGroups(
      groups.map((g) =>
        g.id === id ? { ...g, permittedShiftMin: minShift, permittedShiftMax: maxShift } : g
      )
    );
  };

  const handleSave = async () => {
    if (totalVehicleMixPct !== 100) {
      setMixError('Cannot save: vehicle type mix must total exactly 100%');
      return;
    }
    try {
      await api.updateVehicleMix(vehicleMix);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setMixError(err.message);
    }
  };

  if (!school) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading school parameters...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 1: School Setup & Cohort Baseline</h1>
            <SourceBadge source="Observed" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure school physical gate limits, the six student cohorts, and vehicular fleet composition.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs self-start md:self-center"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Changes Saved' : 'Save Setup'}</span>
        </button>
      </div>

      {/* Grid: School Metadata & Gate Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">School Identity</span>
            <SourceBadge source="Observed" size="sm" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Institution Name</label>
            <input
              type="text"
              value={school.name}
              onChange={(e) => setSchool({ ...school, name: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-blue-200 rounded-lg font-medium text-slate-900 focus:outline-blue-600 bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Address / Frontage Road</label>
            <input
              type="text"
              value={school.address}
              onChange={(e) => setSchool({ ...school, address: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-blue-200 rounded-lg text-slate-700 focus:outline-blue-600 bg-white"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Gate-Side Holding Capacity</span>
            <FormulaTooltip formulaKey="capacity" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700">
            {school.gateSideCapacity}{' '}
            <span className="text-xs font-normal text-slate-500">Vehicles Max</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Length of curbside deceleration lane before queue obstructs arterial traffic on Arcot Road.
            Beyond 8 vehicles, queue spillback creates immediate gridlock.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Total Student Census</span>
            <SourceBadge source="Observed" size="sm" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {school.studentCountTotal.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">Enrolled Students</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Divided into 6 administrative grade clusters across kindergarten, primary, middle, and higher secondary.
          </p>
        </div>
      </div>

      {/* Six Student Groups Table */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Six Student Cohorts & Permitted Timing Bands</h2>
            <p className="text-xs text-slate-500">
              Arrival and departure hours under single-bell baseline, and boundaries for simulation search
            </p>
          </div>
          <SourceBadge source="Observed" size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-blue-100 font-medium">
              <tr>
                <th className="py-2.5 px-3">Student Group</th>
                <th className="py-2.5 px-3">Grade Band</th>
                <th className="py-2.5 px-3">Count</th>
                <th className="py-2.5 px-3">Baseline Arrival</th>
                <th className="py-2.5 px-3">Baseline Departure</th>
                <th className="py-2.5 px-3">Permitted Shift Range</th>
                <th className="py-2.5 px-3">Default Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-blue-50/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {group.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{group.gradeBand}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-medium text-slate-800">
                    {group.studentCount}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                    {group.baselineArrival} AM
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                    {group.baselineDeparture} PM
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-blue-700 font-medium">
                        [{group.permittedShiftMin}m, +{group.permittedShiftMax}m]
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                      {group.assignedZoneId.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Split: Vehicle Mix Editor vs Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Vehicle Mix Editor */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Vehicle-Type Mix & Dwell Physics</h3>
                <p className="text-xs text-slate-500">
                  Must total exactly 100%. Impacts physical queue length and turnover time.
                </p>
              </div>
              <SourceBadge source="Synthetic" size="sm" />
            </div>

            <div className="space-y-3">
              {vehicleMix.map((item, idx) => (
                <div key={item.type} className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-blue-50/40 border border-blue-100/70">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500">
                      Avg Len: {item.vehicleLengthMeters}m · Clearance Gap: {item.safetyGapMeters}m · Dwell: {item.typicalDwellSeconds}s
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.percentage}
                      onChange={(e) => handleMixChange(idx, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center font-mono font-semibold text-slate-900 border border-blue-200 rounded bg-white text-xs"
                    />
                    <span className="font-mono text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Mix Sum Indicator */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Total Mix Sum:</span>
              <span
                className={`font-mono text-sm font-bold tabular-nums ${
                  totalVehicleMixPct === 100 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {totalVehicleMixPct}% / 100%
              </span>
            </div>

            {mixError && (
              <div className="mt-2 p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{mixError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Leaflet Map of School and Candidate Zones */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">School & Candidate Stopping Areas</h3>
                <p className="text-xs text-slate-500">
                  Interactive Leaflet map displaying Main Gate and candidate drop-off bays
                </p>
              </div>
              <SourceBadge source="Observed" size="sm" />
            </div>

            <ZoneMapCard
              school={school}
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(id) => setSelectedZoneId(id)}
              height={320}
            />
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Click any marker to view kerbside usable length and safety status</span>
            <span className="font-semibold text-blue-700">3 Candidate Zones Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
