import React, { useRef } from 'react';
import type { Difficulty, GameStateData } from '../../game/rules';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PlayerCarSvg } from '../CarSvg';
import { DifficultyPicker } from '../DifficultyPicker';

interface TitleOverlayProps {
  state: GameStateData;
  onStartGame: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  state,
  onStartGame,
  onSelectDifficulty,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Start game"
      className="absolute inset-0 z-20 flex flex-col items-center justify-between rounded-xl bg-[#090d16] p-4 text-center sm:p-5"
    >
      <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-amber-400">
        MODERNIZED HANDHELD EDITION
      </div>

      <div className="my-auto flex w-full flex-col items-center">
        <div className="mb-1 h-16 w-14">
          <PlayerCarSvg
            model={state.playerShape}
            isTurbo={true}
            className="h-full w-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          />
        </div>

        <svg viewBox="0 0 260 56" className="mb-1 h-12 w-56" aria-hidden="true">
          <text
            x="130"
            y="28"
            textAnchor="middle"
            fill="#f8fafc"
            fontFamily="Chakra Petch, sans-serif"
            fontWeight="700"
            fontSize="26"
            letterSpacing="2"
          >
            TURBO RACER
          </text>
          <text
            x="130"
            y="49"
            textAnchor="middle"
            fill="#fbbf24"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
            fontSize="12"
            letterSpacing="4"
          >
            HIGHWAY EDITION DX-99
          </text>
        </svg>

        <p className="mb-3 max-w-[260px] text-xs leading-relaxed text-slate-300">
          Steer your supercar across 3 highway lanes. Select difficulty and hold{' '}
          <span className="font-semibold text-amber-300">Turbo</span> to ignite
          afterburners.
        </p>

        <div className="mb-4 w-full max-w-[270px]">
          <DifficultyPicker
            value={state.difficulty}
            onChange={onSelectDifficulty}
            withMeta
          />
        </div>

        <button
          type="button"
          data-start="true"
          onClick={onStartGame}
          className="tactile-btn focus-ring whitespace-nowrap rounded-lg bg-emerald-500 px-7 py-2.5 font-display text-base font-bold tracking-wide text-slate-950 shadow-[0_4px_0_#047857] hover:bg-emerald-400"
        >
          Start Race
        </button>
      </div>

      <div className="text-[11px] font-mono-tabular text-slate-400">
        ←/→ Change Lane · Space Turbo · P Pause
      </div>
    </div>
  );
};
