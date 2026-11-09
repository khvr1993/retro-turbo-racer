import { useEffect, useRef } from 'react';
import type { GamePhase } from './rules';

const MAX_CATCHUP_STEPS = 4;

/**
 * Runs a fixed-timestep game loop on requestAnimationFrame.
 * Depends only on the phase, so speed changes never restart the timer.
 */
export function useGameLoop(
  phase: GamePhase,
  getStepMs: () => number,
  onTick: () => void
): void {
  const stepRef = useRef(getStepMs);
  const tickRef = useRef(onTick);

  useEffect(() => {
    stepRef.current = getStepMs;
    tickRef.current = onTick;
  });

  useEffect(() => {
    if (phase !== 'playing') return;
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return;
    }

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const frame = (now: number) => {
      const step = Math.max(16, stepRef.current());
      // Clamp large gaps (background tab, debugger) so catch-up cannot snowball.
      const delta = Math.min(now - last, step * MAX_CATCHUP_STEPS);
      last = now;
      accumulator += delta;

      let steps = 0;
      while (accumulator >= step && steps < MAX_CATCHUP_STEPS) {
        accumulator -= step;
        steps += 1;
        tickRef.current();
      }
      if (steps === MAX_CATCHUP_STEPS) accumulator = 0;

      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(raf);
  }, [phase]);
}
