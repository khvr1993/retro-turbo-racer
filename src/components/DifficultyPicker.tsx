import React from 'react';
import { DIFFICULTY_SETTINGS, type Difficulty } from '../game/rules';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const SELECTED_CLASSES: Record<Difficulty, string> = {
  easy: 'bg-emerald-500 text-slate-950 shadow-sm',
  medium: 'bg-amber-400 text-slate-950 shadow-sm',
  hard: 'bg-rose-500 text-white shadow-sm',
};

const HINTS: Record<Difficulty, string> = {
  easy: 'Slower speed · Lower oncoming spawn rate',
  medium: 'Standard speed · Balanced spawn rate (Default)',
  hard: 'Fast speed · High oncoming traffic density',
};

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  withMeta?: boolean;
  size?: 'sm' | 'md';
}

export const DifficultyPicker: React.FC<DifficultyPickerProps> = ({
  value,
  onChange,
  withMeta = false,
  size = 'md',
}) => {
  return (
    <div className="w-full">
      {withMeta && (
        <div className="text-[10px] font-mono-tabular text-slate-400 uppercase tracking-wider mb-1.5">
          SELECT DIFFICULTY
        </div>
      )}

      <div
        role="group"
        aria-label="Select Difficulty"
        className={`grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface-panel)] border border-slate-700/80 rounded-lg ${
          withMeta ? 'mb-1' : ''
        }`}
      >
        {DIFFICULTIES.map((difficulty) => {
          const isSelected = value === difficulty;
          return (
            <button
              key={difficulty}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(difficulty)}
              className={`${size === 'sm' ? 'py-1 px-2 rounded' : 'py-1.5 px-2 rounded-md'} text-xs font-mono-tabular font-bold transition-colors cursor-pointer whitespace-nowrap focus-ring ${
                isSelected
                  ? SELECTED_CLASSES[difficulty]
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {DIFFICULTY_SETTINGS[difficulty].label}
            </button>
          );
        })}
      </div>

      {withMeta && (
        <div className="text-[10px] font-mono-tabular text-slate-400 mt-1">
          {HINTS[value]}
        </div>
      )}
    </div>
  );
};
