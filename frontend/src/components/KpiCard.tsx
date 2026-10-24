import React from 'react';
import { DataSource } from '../types';
import { SourceBadge } from './SourceBadge';
import { FormulaTooltip } from './FormulaTooltip';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  baselineValue?: string | number;
  simulatedChangePct?: number; // e.g. -64.1%
  isReductionBetter?: boolean; // default true for queues, delays, wait times
  source?: DataSource;
  formulaKey?: 'delay' | 'disruption' | 'capacity' | 'simulated_change';
  status?: 'normal' | 'warning' | 'alert';
  subtitle?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  baselineValue,
  simulatedChangePct,
  isReductionBetter = true,
  source = 'Observed',
  formulaKey,
  status = 'normal',
  subtitle,
  className = '',
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'warning':
        return 'border-amber-200 bg-white';
      case 'alert':
        return 'border-rose-200 bg-white';
      default:
        return 'border-blue-100 bg-white';
    }
  };

  const isPositiveChange = simulatedChangePct !== undefined && (
    isReductionBetter ? simulatedChangePct > 0 : simulatedChangePct < 0
  );

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${getStatusBorder()} ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-600 line-clamp-1">{label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {source && <SourceBadge source={source} size="sm" />}
            {formulaKey && <FormulaTooltip formulaKey={formulaKey} />}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 my-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {value}
          </span>
          {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
        {simulatedChangePct !== undefined ? (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Simulated change vs baseline:</span>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold font-mono tabular-nums ${
                simulatedChangePct === 0
                  ? 'text-slate-600'
                  : isPositiveChange
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}
            >
              {isPositiveChange ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : simulatedChangePct === 0 ? null : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {simulatedChangePct > 0 ? `-${Math.abs(simulatedChangePct).toFixed(1)}%` : `${simulatedChangePct.toFixed(1)}%`}
            </span>
          </div>
        ) : baselineValue !== undefined ? (
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Baseline single bell:</span>
            <span className="font-mono tabular-nums font-medium text-slate-700">
              {baselineValue} {unit}
            </span>
          </div>
        ) : null}

        {subtitle && (
          <span className="text-[11px] text-slate-500 truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
};
