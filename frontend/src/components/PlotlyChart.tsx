import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export interface PlotlyChartProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  className?: string;
  height?: number | string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout = {},
  config = {},
  className = '',
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultLayout: Partial<Plotly.Layout> = {
      font: {
        family: 'Inter, sans-serif',
        size: 11,
        color: '#475569',
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 45, r: 20, t: 25, b: 40 },
      hoverlabel: {
        bgcolor: '#0F172A',
        bordercolor: '#1E293B',
        font: { color: '#FFFFFF', family: 'Inter, sans-serif', size: 11 },
      },
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.15,
        xanchor: 'left',
        font: { size: 11, color: '#334155' },
      },
      xaxis: {
        gridcolor: '#EFF6FF',
        linecolor: '#DBEAFE',
        tickfont: { color: '#64748B', size: 10 },
        zerolinecolor: '#DBEAFE',
      },
      yaxis: {
        gridcolor: '#EFF6FF',
        linecolor: '#DBEAFE',
        tickfont: { color: '#64748B', size: 10 },
        zerolinecolor: '#DBEAFE',
      },
      ...layout,
    };

    const defaultConfig: Partial<Plotly.Config> = {
      displayModeBar: false,
      responsive: true,
      ...config,
    };

    Plotly.newPlot(containerRef.current, data, defaultLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
};
