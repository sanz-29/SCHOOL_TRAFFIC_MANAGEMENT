import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PickupZone, School, VehicleType, ZoneVerificationChecklist } from '../types';
import { ZoneMapCard } from '../components/ZoneMapCard';
import { ZoneStatusBadge } from '../components/ZoneStatusBadge';
import { SourceBadge } from '../components/SourceBadge';
import { FormulaTooltip } from '../components/FormulaTooltip';
import { useAuth } from '../auth';
import {
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Save,
  ArrowRight,
  Info,
  Car,
  Lock
} from 'lucide-react';

export const PickupZonesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, can } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone_a');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, z] = await Promise.all([api.getSchool(), api.getPickupZones()]);
        setSchool(s);
        setZones(z);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const handleChecklistToggle = async (key: keyof ZoneVerificationChecklist) => {
    if (!selectedZone) return;

    if (!can('verify_zone_safety')) {
      setErrorMessage('Permission Notice: Only the Principal holds statutory authority to mark a pickup zone checklist as verified.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const updatedChecklist = {
      ...selectedZone.verificationChecklist,
      [key]: !selectedZone.verificationChecklist[key],
    };

    try {
      const updated = await api.verifyZoneChecklist(
        selectedZone.id,
        updatedChecklist,
        user?.name || 'Dr. Revathy Soundararajan (Principal)'
      );
      setZones(zones.map((z) => (z.id === selectedZone.id ? updated : z)));
      if (updated.legalSafetyVerified) {
        setSuccessMessage(`Safety checklist complete. ${selectedZone.code} is now officially marked as VERIFIED.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleLengthChange = async (newLength: number) => {
    if (!selectedZone) return;
    try {
      const updated = await api.updatePickupZone(selectedZone.id, {
        usableLengthMeters: Math.max(10, newLength),
      });
      setZones(zones.map((z) => (z.id === selectedZone.id ? updated : z)));
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Test over-capacity assignment for failure handling demonstration
  const handleSimulateOverCapacity = async () => {
    if (!selectedZone) return;
    const excessiveCount = selectedZone.capacityVehicles + 6;
    setErrorMessage(
      `Assignment Rejected: Attempted to route ${excessiveCount} vehicles to ${selectedZone.code} (${selectedZone.name}), but maximum physical holding capacity is only ${selectedZone.capacityVehicles} vehicles. This would cause severe secondary spillback.`
    );
    // Mark zone as over-capacity in state to display visual alert
    setZones(
      zones.map((z) =>
        z.id === selectedZone.id
          ? { ...z, assignedVehicleCount: excessiveCount, isOverCapacity: true }
          : z
      )
    );
  };

  const handleResetCapacityTest = () => {
    setErrorMessage(null);
    setZones(
      zones.map((z) =>
        z.id === selectedZone.id
          ? { ...z, assignedVehicleCount: Math.min(z.assignedVehicleCount, z.capacityVehicles), isOverCapacity: false }
          : z
      )
    );
  };

  if (loading || !school || !selectedZone) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading pickup zone layout...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 6: Pickup Zones & Kerbside Safety</h1>
            <FormulaTooltip formulaKey="capacity" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physical usable length, vehicle assignment, and mandatory human safety verification checklist.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/simulation')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
        >
          <span>Proceed to Step 7: Simulation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Global Alerts Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Over-Capacity Assignment Rejected:</span>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetCapacityTest}
            className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded text-xs font-semibold hover:bg-rose-100 shrink-0"
          >
            Reset Assignment
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Zone Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {zones.map((zone) => {
          const isSelected = selectedZone.id === zone.id;

          return (
            <div
              key={zone.id}
              onClick={() => {
                setSelectedZoneId(zone.id);
                setErrorMessage(null);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-blue-100 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                    {zone.code}
                  </span>
                  <ZoneStatusBadge verified={zone.legalSafetyVerified} />
                </div>
                <div className="font-semibold text-slate-900 text-sm">{zone.name}</div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{zone.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="font-sans text-slate-500 text-[11px]">Capacity:</span>
                <span className="font-bold text-slate-800">
                  {zone.assignedVehicleCount} / {zone.capacityVehicles} veh
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Interactive Map vs Active Zone Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Leaflet Map */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Spatial Zone Layout (Leaflet GIS)</h2>
                <p className="text-xs text-slate-500">
                  Visualizing kerbside stopping bays relative to school main pedestrian gate
                </p>
              </div>
              <SourceBadge source="Observed" size="sm" />
            </div>

            <ZoneMapCard
              school={school}
              zones={zones}
              selectedZoneId={selectedZone.id}
              onSelectZone={(id) => setSelectedZoneId(id)}
              height={340}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Click any zone pin to focus parameters</span>
            <span className="font-medium text-blue-700">All zones geo-referenced</span>
          </div>
        </div>

        {/* Right Column: Active Zone Configuration & Safety Checklist */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedZone.code}: {selectedZone.name}
                </span>
              </div>
              <span className="text-xs text-slate-500">{selectedZone.description}</span>
            </div>
            <ZoneStatusBadge
              verified={selectedZone.legalSafetyVerified}
              verifiedBy={selectedZone.verifiedBy}
              verifiedAt={selectedZone.verifiedAt}
            />
          </div>

          {/* Mathematical Capacity Calculator Card */}
          <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Capacity Formula:</span>
              <span className="font-mono text-[11px] text-blue-800 font-bold">
                Capacity = ⌊ L_usable / (L_veh + gap) ⌋
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-500">Usable Length (Meters)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={selectedZone.usableLengthMeters}
                    onChange={(e) => handleLengthChange(parseInt(e.target.value) || 10)}
                    className="w-24 px-2.5 py-1 text-xs border border-blue-200 rounded font-mono font-bold bg-white text-slate-800"
                  />
                  <span className="text-xs text-slate-500">meters</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500">Concurrent Bay Capacity</label>
                <div className="text-base font-bold font-mono text-blue-700 mt-1">
                  {selectedZone.capacityVehicles}{' '}
                  <span className="text-xs font-normal text-slate-500">vehicles</span>
                </div>
              </div>
            </div>

            {/* Over-capacity test trigger */}
            <div className="pt-2 flex items-center justify-between border-t border-blue-100 text-[11px]">
              <span className="text-slate-500">Demonstrate rejection handling:</span>
              <button
                type="button"
                onClick={handleSimulateOverCapacity}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-[10px] cursor-pointer"
              >
                Test Over-Capacity Assignment
              </button>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Mandatory Human Safety & Legal Checklist
              </span>
              <span className="text-[10px] text-slate-500">
                {Object.values(selectedZone.verificationChecklist).filter(Boolean).length}/4 Verified
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  key: 'legalAccess',
                  title: '1. Municipal Road & Police Right-of-Way Permit',
                  desc: 'Authorized curbside stopping permit from local traffic police division.',
                },
                {
                  key: 'pedestrianSafety',
                  title: '2. Continuous Curbside Footpath & Crossing Guard',
                  desc: 'Children discharge directly onto covered pavement without crossing roadway.',
                },
                {
                  key: 'emergencyClearance',
                  title: '3. Unimpeded Emergency Vehicle Access',
                  desc: 'Maintains minimum 3.5m clear corridor for fire engine and ambulance bypass.',
                },
                {
                  key: 'lightingAndSignage',
                  title: '4. High-Visibility School Zone Signage & Pavement Markings',
                  desc: 'Kerbside painted with yellow stopping markings and designated timing signs.',
                },
              ].map((item) => {
                const checked = selectedZone.verificationChecklist[item.key as keyof ZoneVerificationChecklist];

                return (
                  <div
                    key={item.key}
                    onClick={() => handleChecklistToggle(item.key as keyof ZoneVerificationChecklist)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      checked
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 accent-blue-700 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className={`font-semibold ${checked ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
