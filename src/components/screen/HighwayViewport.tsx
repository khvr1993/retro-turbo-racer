import React, { useRef } from 'react';
import { PLAYER_ROW, type GameStateData } from '../../game/rules';
import { EnemyCarSvg, PlayerCarSvg } from '../CarSvg';

interface HighwayViewportProps {
  state: GameStateData;
  tickMs: number;
  reducedMotion: boolean;
  onShiftLane: (delta: -1 | 1) => void;
}

type CssVars = React.CSSProperties & {
  '--scroll-duration'?: string;
  '--scroll-state'?: string;
};

function scrollVars(durationMs: number, playing: boolean): CssVars {
  return {
    '--scroll-duration': `${Math.max(120, Math.round(durationMs))}ms`,
    '--scroll-state': playing ? 'running' : 'paused',
  };
}

function carTransform(lane: number, row: number): string {
  // One lane is 30cqw (the road is 90% of the viewport); one row is 5cqh.
  return `translate(${lane * 30}cqw, ${row * 5}cqh)`;
}

export const HighwayViewport: React.FC<HighwayViewportProps> = ({
  state,
  tickMs,
  reducedMotion,
  onShiftLane,
}) => {
  const touchStartX = useRef<number | null>(null);
  const playing = state.phase === 'playing';
  const enemyTransitionMs = reducedMotion ? 0 : Math.min(110, Math.round(tickMs * 0.85));

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartX.current = touch ? touch.clientX : null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    const touch = event.changedTouches[0];
    if (start === null || !touch) return;

    const deltaX = touch.clientX - start;
    if (Math.abs(deltaX) > 24) {
      onShiftLane(deltaX > 0 ? 1 : -1);
    }
  };

  return (
    <div
      className="relative aspect-[216/436] w-full max-w-[216px] flex-1 min-w-0 overflow-hidden rounded-md border border-slate-800 bg-[var(--surface-viewport)] [container-type:size] touch-pan-y"
      data-testid="highway-viewport"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartX.current = null;
      }}
    >
      {/* Left 90%: 3-lane asphalt roadway */}
      <div className="absolute inset-y-0 left-0 w-[90%] overflow-hidden bg-[var(--surface-road)]">
        {/* Subtle asphalt texture scrolling at the current game speed */}
        <div
          className="road-scroll pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '100% 22px',
            ...scrollVars(tickMs * 2, playing),
          }}
        />

        {/* Left & right highway shoulder lines */}
        <div className="absolute left-[2px] top-0 bottom-0 w-[2px] bg-amber-400/40" />
        <div className="absolute right-[2px] top-0 bottom-0 w-[2px] bg-slate-400/35" />

        {/* Scrolling dashed lane dividers between the three lanes */}
        {[33.333, 66.666].map((leftPct) => (
          <div
            key={leftPct}
            className="road-scroll pointer-events-none absolute top-0 bottom-0 -ml-[1px] w-[2px]"
            style={{
              left: `${leftPct}%`,
              backgroundImage:
                'repeating-linear-gradient(to bottom, var(--lane-dash) 0 20px, transparent 20px 40px)',
              ...scrollVars(tickMs * 2, playing),
            }}
          />
        ))}

        {/* Oncoming traffic */}
        {state.enemies.map((enemy) => (
          <div
            key={enemy.id}
            data-testid="enemy-car"
            data-lane={enemy.lane}
            data-color={enemy.color}
            className="absolute left-0 top-0 h-[15%] w-1/3 px-1.5 will-change-transform"
            style={{
              transform: carTransform(enemy.lane, enemy.row),
              transition: enemyTransitionMs > 0 ? `transform ${enemyTransitionMs}ms linear` : 'none',
            }}
          >
            <EnemyCarSvg
              color={enemy.color}
              shape={enemy.shape}
              className="h-full w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.75)]"
            />
          </div>
        ))}

        {/* Player supercar at the bottom of the grid */}
        <div
          data-testid="player-car"
          data-lane={state.playerLane}
          data-model={state.playerShape}
          className="absolute left-0 top-0 z-10 h-[15%] w-1/3 px-1.5 will-change-transform"
          style={{
            transform: carTransform(state.playerLane, PLAYER_ROW),
            transition: reducedMotion ? 'none' : 'transform 150ms ease-out',
          }}
        >
          <PlayerCarSvg
            model={state.playerShape}
            isTurbo={state.isTurbo}
            isCrashed={state.phase === 'gameover'}
            className="h-full w-full drop-shadow-[0_6px_12px_rgba(16,185,129,0.35)]"
          />
        </div>

        {/* Collision spark burst */}
        {state.phase === 'gameover' && (
          <div
            className="pointer-events-none absolute left-0 top-0 z-20 flex h-[15%] w-1/3 animate-pulse items-center justify-center px-1.5"
            style={{ transform: carTransform(state.playerLane, PLAYER_ROW - 1) }}
          >
            <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
              <polygon
                points="32,2 39,20 58,14 45,30 62,42 42,44 46,62 32,48 18,62 22,44 2,42 19,30 6,14 25,20"
                fill="#ef4444"
                stroke="#fef08a"
                strokeWidth="2.5"
              />
              <circle cx="32" cy="32" r="10" fill="#fef08a" />
            </svg>
          </div>
        )}
      </div>

      {/* Right 10%: scrolling racing curb strip */}
      <div
        className="road-scroll absolute inset-y-0 right-0 w-[10%] border-l border-slate-700/80"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--curb-lit) 0 18px, var(--curb-dark) 18px 36px)',
          ...scrollVars(tickMs * 1.65, playing),
        }}
      />
    </div>
  );
};
