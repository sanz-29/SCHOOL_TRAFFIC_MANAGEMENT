import React from 'react';
import { SimulationEngine } from '../types';
import { Cpu } from 'lucide-react';

interface EngineBadgeProps {
  engine: SimulationEngine;
  className?: string;
  showIcon?: boolean;
}

export const EngineBadge: React.FC<EngineBadgeProps> = ({ engine, className = '', showIcon = true }) => {
  const getBadgeStyle = () => {
    switch (engine) {
      case 'SUMO':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-semibold';
      case 'Fast model':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Fallback simulator':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${getBadgeStyle()} ${className}`}
      title={`Engine: ${engine}. Results are simulated under stated model parameters.`}
    >
      {showIcon && <Cpu className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
      <span className="font-medium">{engine}</span>
      <span className="text-[10px] uppercase tracking-wider text-blue-700 bg-white/70 px-1 py-0.2 rounded border border-blue-200">
        Simulated
      </span>
    </span>
  );
};
