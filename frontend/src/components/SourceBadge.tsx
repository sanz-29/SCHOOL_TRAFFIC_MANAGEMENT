import React from 'react';
import { DataSource } from '../types';
import { Database, Cpu, HelpCircle } from 'lucide-react';

interface SourceBadgeProps {
  source: DataSource;
  size?: 'sm' | 'md';
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, size = 'sm', className = '' }) => {
  const getBadgeStyle = () => {
    switch (source) {
      case 'Observed':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Synthetic':
        return 'text-indigo-800 bg-indigo-50 border-indigo-200';
      case 'Assumed':
        return 'text-slate-700 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getTooltip = () => {
    switch (source) {
      case 'Observed':
        return 'Direct manual gate count or video survey data recorded at school entrance.';
      case 'Synthetic':
        return 'Calibrated model distribution matching student cohort counts and school survey.';
      case 'Assumed':
        return 'Heuristic assumption based on regional standard vehicle sizes and stopping durations.';
    }
  };

  const isSmall = size === 'sm';

  return (
    <span
      title={getTooltip()}
      className={`inline-flex items-center gap-1 font-medium border rounded px-1.5 py-0.5 cursor-help transition-colors ${
        isSmall ? 'text-[11px]' : 'text-xs px-2 py-1'
      } ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      <span>Source: {source}</span>
    </span>
  );
};
