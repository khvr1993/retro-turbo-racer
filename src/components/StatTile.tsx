import React from 'react';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  accentClassName?: string;
  testId?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  accentClassName = 'text-emerald-400',
  testId,
}) => {
  return (
    <div className="bg-[#131c2e] border border-slate-700/80 rounded-lg p-2">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div
        className={`text-lg font-extrabold tracking-tight mt-0.5 ${accentClassName}`}
        data-testid={testId}
      >
        {value}
      </div>
    </div>
  );
};
