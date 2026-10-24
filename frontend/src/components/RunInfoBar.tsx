import React from 'react';
import { SimulationEngine } from '../types';
import { EngineBadge } from './EngineBadge';
import { Hash, Sparkles, Clock } from 'lucide-react';

interface RunInfoBarProps {
  scenarioName?: string;
  seed?: number;
  modelVersion?: string;
  engine?: SimulationEngine;
  timestamp?: string;
  className?: string;
}

export const RunInfoBar: React.FC<RunInfoBarProps> = ({
  scenarioName = 'Morning Peak Rush — Baseline Calibration',
  seed = 48291,
  modelVersion = 'SUMO-v1.18-SchoolGate',
  engine = 'SUMO',
  timestamp = '2026-10-24 07:45 - 08:15',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-slate-700 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-900">
          <span className="text-blue-700 font-semibold">Scenario:</span>
          <span>{scenarioName}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span>Seed: <span className="font-mono tabular-nums text-slate-800">{seed}</span></span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <span>Model: <span className="font-mono text-slate-800">{modelVersion}</span></span>
        </div>
        {timestamp && (
          <div className="hidden sm:flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timestamp}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <EngineBadge engine={engine} />
      </div>
    </div>
  );
};
