import React from 'react';
import {
  DIFFICULTY_SETTINGS,
  getTickIntervalMs,
  type Difficulty,
  type GameStateData,
} from '../game/rules';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { GameOverOverlay } from './screen/GameOverOverlay';
import { HighwayViewport } from './screen/HighwayViewport';
import { PauseOverlay } from './screen/PauseOverlay';
import { TelemetryPanel } from './screen/TelemetryPanel';
import { TitleOverlay } from './screen/TitleOverlay';

interface GridScreenProps {
  state: GameStateData;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onReturnTitle: () => void;
  onToggleShape: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onShiftLane: (delta: -1 | 1) => void;
}

export const GridScreen: React.FC<GridScreenProps> = ({
  state,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onReturnTitle,
  onToggleShape,
  onSelectDifficulty,
  onShiftLane,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const tickMs = getTickIntervalMs(state.level, state.isTurbo, state.difficulty);

  return (
    <div
      className="relative w-full rounded-xl border-4 border-[#1e293b] bg-[var(--surface-screen)] p-3 shadow-[inset_0_4px_20px_rgba(0,0,0,0.85)] sm:p-4"
      data-testid="handheld-screen"
      data-turbo={state.isTurbo ? 'true' : 'false'}
      data-difficulty={state.difficulty}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div className="sr-only" aria-live="assertive">
        {state.phase === 'gameover' ? 'Game over' : ''}
      </div>
      <div className="sr-only" aria-live="polite">
        {state.phase === 'paused' ? 'Game paused' : ''}
      </div>

      {/* Top bezel screen header */}
      <div className="mb-2 flex items-center justify-between px-1 font-mono-tabular text-[11px] tracking-wider text-slate-400">
        <span>
          MODE:{' '}
          <strong className="uppercase text-slate-200">
            {DIFFICULTY_SETTINGS[state.difficulty].label}
          </strong>
        </span>
        <span className="font-bold text-amber-400">
          {state.isTurbo ? 'TURBO NITRO 2X' : `GEAR LV.${state.level}`}
        </span>
      </div>

      {/* Highway viewport + LCD telemetry column */}
      <div className="flex items-stretch gap-3">
        <div className="relative min-w-0 max-w-[228px] flex-1 rounded-lg border-2 border-[#263248] bg-[var(--surface-viewport)] p-1.5">
          <div className="mb-1 grid grid-cols-10 gap-[3px] text-center font-mono-tabular text-[9px] text-slate-400">
            <span className="col-span-3 border-b border-slate-700/70 pb-0.5">LANE 1</span>
            <span className="col-span-3 border-b border-slate-700/70 pb-0.5">LANE 2</span>
            <span className="col-span-3 border-b border-slate-700/70 pb-0.5">LANE 3</span>
            <span className="col-span-1 border-b border-amber-500/40 pb-0.5 text-amber-400/80">
              TR
            </span>
          </div>

          <HighwayViewport
            state={state}
            tickMs={tickMs}
            reducedMotion={reducedMotion}
            onShiftLane={onShiftLane}
          />
        </div>

        <TelemetryPanel state={state} onToggleShape={onToggleShape} />
      </div>

      {/* Screen-fitted overlays */}
      {state.phase === 'title' && (
        <TitleOverlay
          state={state}
          onStartGame={onStartGame}
          onSelectDifficulty={onSelectDifficulty}
        />
      )}

      {state.phase === 'paused' && (
        <PauseOverlay
          state={state}
          onResumeGame={onResumeGame}
          onRestartGame={onRestartGame}
          onReturnTitle={onReturnTitle}
        />
      )}

      {state.phase === 'gameover' && (
        <GameOverOverlay
          state={state}
          onRestartGame={onRestartGame}
          onReturnTitle={onReturnTitle}
          onSelectDifficulty={onSelectDifficulty}
        />
      )}
    </div>
  );
};
