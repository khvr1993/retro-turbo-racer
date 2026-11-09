import React, { useRef } from 'react';
import { DIFFICULTY_SETTINGS, type Difficulty, type GameStateData } from '../../game/rules';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { DifficultyPicker } from '../DifficultyPicker';
import { StatTile } from '../StatTile';

interface GameOverOverlayProps {
  state: GameStateData;
  onRestartGame: () => void;
  onReturnTitle: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  state,
  onRestartGame,
  onReturnTitle,
  onSelectDifficulty,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Game Over"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-[#090d16] p-4 text-center sm:p-5"
    >
      <div className="mb-0.5 text-xs font-mono-tabular uppercase tracking-widest text-rose-400">
        COLLISION DETECTED
      </div>
      <h2 className="mb-3 font-display text-3xl font-bold tracking-wide text-white">
        GAME OVER
      </h2>

      <div className="mb-3 grid w-full max-w-[260px] grid-cols-2 gap-2 font-mono-tabular">
        <StatTile
          label="FINAL SCORE"
          value={Math.round(state.score)}
          accentClassName="text-emerald-400"
        />
        <StatTile
          label="HIGH SCORE"
          value={Math.round(state.highScore)}
          accentClassName="text-amber-300"
        />
        <StatTile
          label="CARS PASSED"
          value={state.carsPassed}
          accentClassName="text-sky-300"
        />
        <StatTile
          label="DIFFICULTY"
          value={DIFFICULTY_SETTINGS[state.difficulty].label}
          accentClassName="text-rose-300 uppercase"
        />
      </div>

      <div className="mb-3 w-full max-w-[260px]">
        <DifficultyPicker
          value={state.difficulty}
          onChange={onSelectDifficulty}
          size="sm"
        />
      </div>

      <div className="flex w-48 flex-col gap-2">
        <button
          type="button"
          data-start="true"
          onClick={onRestartGame}
          className="tactile-btn focus-ring whitespace-nowrap rounded-lg bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-slate-950 shadow-[0_4px_0_#b45309] hover:bg-amber-300"
        >
          Play Again
        </button>
        <button
          type="button"
          onClick={onReturnTitle}
          className="tactile-btn focus-ring whitespace-nowrap rounded-lg px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200"
        >
          Title Screen
        </button>
      </div>
    </div>
  );
};
