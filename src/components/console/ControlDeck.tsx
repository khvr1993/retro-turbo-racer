import React from 'react';

interface ControlDeckProps {
  isTurbo: boolean;
  hapticPulse: 'left' | 'right' | null;
  onShiftLane: (delta: -1 | 1) => void;
  onSetTurbo: (active: boolean) => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  isTurbo,
  hapticPulse,
  onShiftLane,
  onSetTurbo,
}) => {
  return (
    <div className="mt-4 flex w-full flex-col gap-3 px-1">
      <div className="grid w-full grid-cols-2 gap-3.5">
        <button
          type="button"
          data-haptic-active={hapticPulse === 'left' ? 'true' : 'false'}
          onClick={() => onShiftLane(-1)}
          aria-label="Move Left Lane"
          className={`tactile-btn focus-ring flex h-20 cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 shadow-[0_6px_0_#090d16] transition-all duration-100 ${
            hapticPulse === 'left'
              ? 'translate-y-[2px] border-emerald-400 bg-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
              : 'border-slate-400/80 bg-[var(--surface-raised)] hover:bg-[#172542] active:bg-slate-800'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9 shrink-0 text-emerald-400"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M15.5 5l-7 7 7 7V5z" />
          </svg>
          <div className="flex flex-col items-start">
            <span className="font-display text-lg font-bold leading-none tracking-wider text-white">
              LEFT
            </span>
            <span className="mt-1 font-mono-tabular text-[10px] text-emerald-300/90">
              STEER · HAPTIC
            </span>
          </div>
        </button>

        <button
          type="button"
          data-haptic-active={hapticPulse === 'right' ? 'true' : 'false'}
          onClick={() => onShiftLane(1)}
          aria-label="Move Right Lane"
          className={`tactile-btn focus-ring flex h-20 cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 shadow-[0_6px_0_#090d16] transition-all duration-100 ${
            hapticPulse === 'right'
              ? 'translate-y-[2px] border-emerald-400 bg-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
              : 'border-slate-400/80 bg-[var(--surface-raised)] hover:bg-[#172542] active:bg-slate-800'
          }`}
        >
          <div className="flex flex-col items-end">
            <span className="font-display text-lg font-bold leading-none tracking-wider text-white">
              RIGHT
            </span>
            <span className="mt-1 font-mono-tabular text-[10px] text-emerald-300/90">
              HAPTIC · STEER
            </span>
          </div>
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9 shrink-0 text-emerald-400"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8.5 5l7 7-7 7V5z" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onMouseDown={() => onSetTurbo(true)}
        onMouseUp={() => onSetTurbo(false)}
        onMouseLeave={() => onSetTurbo(false)}
        onTouchStart={(event) => {
          event.preventDefault();
          onSetTurbo(true);
        }}
        onTouchEnd={(event) => {
          event.preventDefault();
          onSetTurbo(false);
        }}
        onKeyDown={(event) => {
          if (event.code === 'Space' || event.key === 'Enter') {
            event.preventDefault();
            onSetTurbo(true);
          }
        }}
        onKeyUp={(event) => {
          if (event.code === 'Space' || event.key === 'Enter') {
            event.preventDefault();
            onSetTurbo(false);
          }
        }}
        aria-label="Hold Turbo Boost"
        aria-pressed={isTurbo}
        className={`tactile-btn focus-ring flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 font-display font-bold text-slate-950 shadow-[0_5px_0_#b45309] transition-colors ${
          isTurbo
            ? 'translate-y-[2px] border-white bg-amber-300'
            : 'border-amber-200 bg-amber-400 hover:bg-amber-300'
        }`}
      >
        <span className="text-[15px] leading-none tracking-wide sm:text-lg sm:tracking-wider">
          TURBO AFTERBURNER
        </span>
        <span className="whitespace-nowrap font-mono-tabular text-xs font-bold text-slate-900">
          [HOLD SPACE]
        </span>
      </button>
    </div>
  );
};
