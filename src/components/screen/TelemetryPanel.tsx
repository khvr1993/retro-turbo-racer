import React from 'react';
import { LANE_COUNT, type GameStateData } from '../../game/rules';
import { PlayerCarSvg } from '../CarSvg';

interface TelemetryPanelProps {
  state: GameStateData;
  onToggleShape: () => void;
}

const LANES = Array.from({ length: LANE_COUNT }, (_, index) => index);

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ state, onToggleShape }) => {
  return (
    <div className="flex w-24 flex-col justify-between rounded-lg border border-[#243046] bg-[var(--surface-panel)] p-2.5 font-mono-tabular sm:w-28 lg:w-32">
      <div className="space-y-2.5">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">SCORE</div>
          <div
            className="mt-0.5 text-lg font-extrabold leading-none tracking-tight text-emerald-400 sm:text-xl"
            data-testid="score-value"
          >
            {String(Math.round(state.score)).padStart(6, '0')}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">HI-SCORE</div>
          <div
            className="mt-0.5 text-base font-bold leading-none tracking-tight text-amber-300"
            data-testid="hiscore-value"
          >
            {String(Math.round(state.highScore)).padStart(6, '0')}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            CARS PASSED
          </div>
          <div
            className="mt-0.5 text-base font-bold leading-none text-sky-300"
            data-testid="passed-value"
          >
            {String(state.carsPassed).padStart(3, '0')}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>SPEED</span>
            <span className="font-bold text-slate-200">{state.level}/10</span>
          </div>
          <div className="mt-1.5 grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-[1px] ${
                  i < state.level
                    ? state.isTurbo
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-2">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>CAR</span>
          <span className="font-bold uppercase text-emerald-300">
            {state.playerShape === 'cross' ? 'APEX GT' : 'F1 X-99'}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleShape}
          aria-label="Switch Player Car Model"
          aria-pressed={state.playerShape === 'i-shape'}
          className="focus-ring flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-slate-700/80 bg-[var(--surface-screen)] py-2 transition-colors hover:bg-[#162033]"
        >
          <div className="h-12 w-10">
            <PlayerCarSvg
              model={state.playerShape}
              isTurbo={state.isTurbo}
              className="h-full w-full"
            />
          </div>
          <span className="mt-1 whitespace-nowrap text-[10px] text-slate-300">
            Switch [C]
          </span>
        </button>
      </div>

      <div className="border-t border-slate-800 pt-2">
        <div className="text-[10px] text-slate-400">LANE POSITION</div>
        <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
          {LANES.map((laneIndex) => (
            <div
              key={laneIndex}
              className={`rounded py-0.5 ${
                state.playerLane === laneIndex
                  ? 'border border-emerald-400/60 bg-emerald-500/30 text-emerald-300'
                  : 'border border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              L{laneIndex + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
