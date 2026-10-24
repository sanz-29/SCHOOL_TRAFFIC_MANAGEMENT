import React from 'react';
import { DataSource, SimulationEngine } from '../types';
import { SourceBadge } from './SourceBadge';
import { EngineBadge } from './EngineBadge';
import { FormulaTooltip } from './FormulaTooltip';
import { PlotlyChart, PlotlyChartProps } from './PlotlyChart';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  source?: DataSource;
  engine?: SimulationEngine;
  formulaKey?: 'delay' | 'disruption' | 'capacity' | 'simulated_change';
  data?: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  height?: number | string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  headerAction?: React.ReactNode;
  footerNote?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  source = 'Synthetic',
  engine,
  formulaKey,
  data,
  layout,
  height = 300,
  isLoading = false,
  error = null,
  onRetry,
  headerAction,
  footerNote,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-blue-100 shadow-sm p-4 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
              {formulaKey && <FormulaTooltip formulaKey={formulaKey} />}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {source && <SourceBadge source={source} size="sm" />}
            {engine && <EngineBadge engine={engine} />}
            {headerAction}
          </div>
        </div>

        <div className="pt-3">
          {isLoading ? (
            <div
              style={{ height: typeof height === 'number' ? `${height}px` : height }}
              className="flex flex-col items-center justify-center gap-2 text-slate-400 bg-blue-50/30 rounded-lg animate-pulse"
            >
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Computing simulation model...</span>
            </div>
          ) : error ? (
            <div
              style={{ height: typeof height === 'number' ? `${height}px` : height }}
              className="flex flex-col items-center justify-center gap-2 text-center p-4 bg-rose-50/50 rounded-lg border border-rose-100"
            >
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <p className="text-xs font-medium text-rose-800">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-1 px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded text-xs hover:bg-rose-50 font-medium"
                >
                  Retry calculation
                </button>
              )}
            </div>
          ) : !data || data.length === 0 ? (
            <div
              style={{ height: typeof height === 'number' ? `${height}px` : height }}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 bg-slate-50 rounded-lg"
            >
              <span className="text-xs">No simulation data available</span>
            </div>
          ) : (
            <PlotlyChart data={data} layout={layout} height={height} />
          )}
        </div>
      </div>

      {footerNote && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{footerNote}</span>
          <span className="text-[10px] text-blue-600 font-medium">Simulated values</span>
        </div>
      )}
    </div>
  );
};
