import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface FormulaTooltipProps {
  formulaKey: 'delay' | 'disruption' | 'capacity' | 'simulated_change';
  className?: string;
}

export const FormulaTooltip: React.FC<FormulaTooltipProps> = ({ formulaKey, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getFormulaContent = () => {
    switch (formulaKey) {
      case 'delay':
        return {
          title: 'Total Vehicle Delay (J_delay)',
          formula: 'J_delay = ∑ (Q_t × Δt)',
          unit: 'vehicle-minutes',
          explanation: 'Sum of vehicle queue length Q at each discrete time increment Δt. Measures aggregate traffic idling time outside the school gate.',
        };
      case 'disruption':
        return {
          title: 'Schedule Disruption (J_disruption)',
          formula: 'J_disruption = ∑ (N_g × |shift_g|)',
          unit: 'student-minutes',
          explanation: 'Disruption penalty weighted by student group cohort size N_g multiplied by absolute schedule shift in minutes from the accustomed schedule.',
        };
      case 'capacity':
        return {
          title: 'Pickup Zone Capacity Formula',
          formula: 'Capacity = ⌊ L_usable / (L_vehicle + gap) ⌋',
          unit: 'vehicles concurrent',
          explanation: 'Usable kerbside length divided by average vehicle length plus dynamic safety clearance gap. Over-capacity assignments are flagged.',
        };
      case 'simulated_change':
        return {
          title: 'Simulated Change vs Baseline',
          formula: 'Simulated Change = 100 × (Baseline - Candidate) / Baseline',
          unit: '% reduction (simulated)',
          explanation: 'Decision-support projection comparing simulated candidate outcome against existing baseline single-bell schedule. Not a real-world guarantee; requires pilot.',
        };
    }
  };

  const content = getFormulaContent();

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-blue-600 focus:outline-none p-0.5 rounded transition-colors"
        title="View mathematical formulation"
        aria-label="View mathematical formula"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white rounded-lg shadow-xl text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700">
            <span className="font-semibold text-blue-300">{content.title}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-1.5 my-1.5 bg-slate-800 rounded font-mono text-center text-blue-200 text-xs">
            {content.formula}
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">{content.explanation}</p>
          <div className="mt-1.5 text-[10px] text-slate-400 italic">Unit: {content.unit}</div>
        </div>
      )}
    </div>
  );
};
