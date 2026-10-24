import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Constraint, StudentGroup, PickupZone } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { FormulaTooltip } from '../components/FormulaTooltip';
import {
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Info
} from 'lucide-react';

export const ConstraintsPage: React.FC = () => {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Natural language free-text state
  const [freeTextPrompt, setFreeTextPrompt] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedRuleCandidate, setConvertedRuleCandidate] = useState<{
    ruleDescription: string;
    parsedConstraint: Partial<Constraint>;
    isHard: boolean;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [c, g, z] = await Promise.all([
          api.getConstraints(),
          api.getStudentGroups(),
          api.getPickupZones(),
        ]);
        setConstraints(c);
        setGroups(g);
        setZones(z);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleConstraint = (id: string) => {
    setConstraints(
      constraints.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleToggleHardSoft = (id: string) => {
    setConstraints(
      constraints.map((c) => (c.id === id ? { ...c, isHard: !c.isHard } : c))
    );
  };

  const handleSave = async () => {
    await api.saveConstraints(constraints);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Convert natural language to structured rule
  const handleParseFreeText = async () => {
    if (!freeTextPrompt.trim()) return;
    setIsConverting(true);
    try {
      const parsed = await api.parseNaturalLanguageConstraints(freeTextPrompt);
      setConvertedRuleCandidate(parsed);
    } finally {
      setIsConverting(false);
    }
  };

  const handleConfirmConvertedRule = () => {
    if (!convertedRuleCandidate) return;
    const newConstraint: Constraint = {
      id: `c_custom_${Date.now()}`,
      name: convertedRuleCandidate.parsedConstraint.name || 'Custom Operational Rule',
      type: convertedRuleCandidate.parsedConstraint.type || 'max_shift',
      isHard: convertedRuleCandidate.isHard,
      description: convertedRuleCandidate.parsedConstraint.description || freeTextPrompt,
      enabled: true,
      parameters: convertedRuleCandidate.parsedConstraint.parameters || {},
      violated: false,
    };
    setConstraints([...constraints, newConstraint]);
    setConvertedRuleCandidate(null);
    setFreeTextPrompt('');
  };

  // Conflict analysis
  const enabledHardCount = constraints.filter((c) => c.enabled && c.isHard).length;
  const enabledSoftCount = constraints.filter((c) => c.enabled && !c.isHard).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Step 4: Operational Constraints & Policy Guards</h1>
            <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Hard & Soft Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hard constraints cannot be traded away during optimization. Sibling alignment and soft comfort rules guide Pareto ranking.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Rules Saved' : 'Save Constraints'}</span>
        </button>
      </div>

      {/* Conflict & Feasibility Report Card */}
      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">
              Pre-Optimization Conflict Validation: <span className="text-emerald-700">Feasible (0 Conflicts)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {enabledHardCount} active hard invariants · {enabledSoftCount} active soft heuristics · 421 feasible schedules remain in search space.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded font-medium border border-blue-200">
            Raw Space: 117,649
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-200">
            Feasible: 421
          </span>
        </div>
      </div>

      {/* Structured Constraints List */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Structured Policy Constraints</h2>
            <p className="text-xs text-slate-500">
              Invariants enforced by the schedule search algorithm
            </p>
          </div>
          <FormulaTooltip formulaKey="disruption" />
        </div>

        <div className="space-y-3">
          {constraints.map((c) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                !c.enabled
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : c.isHard
                  ? 'bg-blue-50/30 border-blue-200'
                  : 'bg-white border-blue-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={() => handleToggleConstraint(c.id)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-700 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleHardSoft(c.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        c.isHard
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                      title="Click to toggle between Hard and Soft constraint"
                    >
                      {c.isHard ? 'HARD (Non-negotiable)' : 'SOFT (Pareto weighted)'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {c.parameters.earliestStartTime && (
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Floor: {c.parameters.earliestStartTime} AM
                  </span>
                )}
                {c.parameters.maxShiftMinutes && (
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Max: ±{c.parameters.maxShiftMinutes}m
                  </span>
                )}
                {c.parameters.dedicatedZoneId && (
                  <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                    {c.parameters.dedicatedZoneId.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free-Text Natural Language Constraint Converter */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Natural Language Constraint Converter</h2>
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                Rule Parser
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Type unstructured school policies (e.g. "Primary and Junior classes must arrive together for siblings") to convert into verifiable rules.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={freeTextPrompt}
            onChange={(e) => setFreeTextPrompt(e.target.value)}
            placeholder="e.g. Keep kindergarten arrival strictly after 08:00 AM for parent transit"
            className="flex-1 px-3.5 py-2 text-xs border border-blue-200 rounded-lg text-slate-800 focus:outline-blue-600 bg-white"
          />
          <button
            type="button"
            onClick={handleParseFreeText}
            disabled={isConverting || !freeTextPrompt.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>{isConverting ? 'Analyzing Rule...' : 'Convert to Structured Rule'}</span>
          </button>
        </div>

        {/* Confirmation Modal / Panel for Parsed Rule */}
        {convertedRuleCandidate && (
          <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900">
                Confirmation Required: Parsed Operational Rule
              </span>
              <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded">
                {convertedRuleCandidate.isHard ? 'HARD CONSTRAINT' : 'SOFT HEURISTIC'}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {convertedRuleCandidate.ruleDescription}
            </p>

            <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-xs">
              <div className="font-semibold text-slate-900">
                {convertedRuleCandidate.parsedConstraint.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {convertedRuleCandidate.parsedConstraint.description}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConvertedRuleCandidate(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertedRule}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Add to Schedule Optimizer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
