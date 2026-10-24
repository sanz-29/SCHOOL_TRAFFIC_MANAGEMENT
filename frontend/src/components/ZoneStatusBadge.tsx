import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface ZoneStatusBadgeProps {
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  className?: string;
}

export const ZoneStatusBadge: React.FC<ZoneStatusBadgeProps> = ({
  verified,
  verifiedBy,
  verifiedAt,
  className = '',
}) => {
  if (verified) {
    return (
      <span
        title={`Verified by ${verifiedBy || 'Authorized Officer'} on ${verifiedAt || 'recent review'}`}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Legal/safety status: VERIFIED</span>
      </span>
    );
  }

  return (
    <span
      title="A human traffic safety officer or principal must complete the safety checklist before zone release."
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>Legal/safety status: UNVERIFIED</span>
    </span>
  );
};
