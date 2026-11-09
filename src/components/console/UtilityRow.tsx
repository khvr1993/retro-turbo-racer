import React from 'react';
import type { GamePhase } from '../../game/rules';

interface UtilityRowProps {
  phase: GamePhase;
  muted: boolean;
  onPrimary: () => void;
  onToggleMute: () => void;
  onToggleShape: () => void;
  onRestart: () => void;
}

const BUTTON_CLASSES =
  'tactile-btn focus-ring flex cursor-pointer flex-col items-center justify-center whitespace-nowrap rounded-lg border border-slate-600 bg-[var(--surface-raised)] px-2 py-1.5 font-mono-tabular text-[10px] text-slate-200 shadow-[0_3px_0_#090d16] hover:bg-[#16223b]';

export const UtilityRow: React.FC<UtilityRowProps> = ({
  phase,
  muted,
  onPrimary,
  onToggleMute,
  onToggleShape,
  onRestart,
}) => {
  const primaryLabel = phase === 'playing' ? 'PAUSE' : 'START';

  return (
    <div className="mb-3.5 grid w-full grid-cols-4 gap-2 px-1" data-testid="top-utility-row">
      <button
        type="button"
        onClick={onPrimary}
        aria-label={phase === 'playing' ? 'Pause Game' : 'Start or Resume Game'}
        className={BUTTON_CLASSES}
      >
        <span className="font-bold text-emerald-400">{primaryLabel}</span>
        <span className="text-[9px] text-slate-400">[P]</span>
      </button>

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
        aria-pressed={muted}
        className={BUTTON_CLASSES}
      >
        <span className="font-bold text-sky-300">{muted ? 'MUTED' : 'SOUND'}</span>
        <span className="text-[9px] text-slate-400">[M]</span>
      </button>

      <button
        type="button"
        onClick={onToggleShape}
        aria-label="Toggle Car Shape"
        className={BUTTON_CLASSES}
      >
        <span className="font-bold text-amber-300">CAR</span>
        <span className="text-[9px] text-slate-400">[C]</span>
      </button>

      <button
        type="button"
        onClick={onRestart}
        aria-label="Reset Game"
        className={BUTTON_CLASSES}
      >
        <span className="font-bold text-rose-400">STOP/RST</span>
        <span className="text-[9px] text-slate-400">[R]</span>
      </button>
    </div>
  );
};
