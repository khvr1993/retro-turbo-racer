import React, { useRef } from 'react';
import { DIFFICULTY_SETTINGS, type GameStateData } from '../../game/rules';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface PauseOverlayProps {
  state: GameStateData;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onReturnTitle: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  state,
  onResumeGame,
  onRestartGame,
  onReturnTitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-[#090d16]/92 p-5 text-center"
    >
      <h2 className="mb-1 font-display text-2xl font-bold tracking-wide text-amber-400">
        RACE PAUSED
      </h2>
      <p className="mb-5 text-xs font-mono-tabular text-slate-400">
        {DIFFICULTY_SETTINGS[state.difficulty].label.toUpperCase()} · SCORE:{' '}
        {Math.round(state.score)} · PASSED: {state.carsPassed}
      </p>

      <div className="flex w-48 flex-col gap-2.5">
        <button
          type="button"
          onClick={onResumeGame}
          className="tactile-btn focus-ring whitespace-nowrap rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_3px_0_#047857] hover:bg-emerald-400"
        >
          Resume Race
        </button>
        <button
          type="button"
          onClick={onRestartGame}
          className="tactile-btn focus-ring whitespace-nowrap rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={onReturnTitle}
          className="tactile-btn focus-ring whitespace-nowrap rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
        >
          Title Screen
        </button>
      </div>
    </div>
  );
};
