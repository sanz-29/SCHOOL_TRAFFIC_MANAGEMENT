import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

export const GlobalFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-blue-100 bg-white py-3 px-6 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 text-slate-600 font-medium">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          Results are simulated under stated assumptions. Real-world benefit needs a school pilot.
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-slate-400">
        <span>Decision-support system · Principal retains final administrative discretion</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">GateFlow AI v2.4 (SUMO calibrated)</span>
      </div>
    </footer>
  );
};
