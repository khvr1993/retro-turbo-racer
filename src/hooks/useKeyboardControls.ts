import { useEffect, useRef } from 'react';
import type { Difficulty, GamePhase } from '../game/rules';

export interface KeyboardControls {
  getPhase: () => GamePhase;
  onStartOrRestart: () => void;
  onTogglePause: () => void;
  onShiftLane: (delta: -1 | 1) => void;
  onSetTurbo: (active: boolean) => void;
  onToggleMute: () => void;
  onToggleShape: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, [role="dialog"], [contenteditable="true"]';

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest(INTERACTIVE_SELECTOR) !== null;
}

function isMenuPhase(phase: GamePhase): boolean {
  return phase === 'title' || phase === 'paused' || phase === 'gameover';
}

export function useKeyboardControls(controls: KeyboardControls): void {
  const controlsRef = useRef(controls);

  useEffect(() => {
    controlsRef.current = controls;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      const phase = c.getPhase();
      const interactive = isInteractiveTarget(e.target);

      if (phase === 'title' || phase === 'gameover') {
        if (e.key === '1') {
          e.preventDefault();
          c.onSelectDifficulty('easy');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          c.onSelectDifficulty('medium');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          c.onSelectDifficulty('hard');
          return;
        }
      }

      if (e.key === 'Enter') {
        // Let focused menu buttons activate natively.
        if (interactive && isMenuPhase(phase)) return;
        if (phase === 'title' || phase === 'gameover') {
          e.preventDefault();
          c.onStartOrRestart();
        } else if (phase === 'paused') {
          e.preventDefault();
          c.onTogglePause();
        }
        return;
      }

      if (e.code === 'Space') {
        if (phase === 'playing') {
          // Space is the turbo key during a race, even when a game button has focus.
          e.preventDefault();
          if (!e.repeat) c.onSetTurbo(true);
          return;
        }
        if (interactive) return;
        e.preventDefault();
        if (phase === 'paused') {
          c.onTogglePause();
        } else if (phase === 'title' || phase === 'gameover') {
          c.onStartOrRestart();
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (!e.repeat) c.onShiftLane(-1);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (!e.repeat) c.onShiftLane(1);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (phase === 'playing' && !e.repeat) {
          c.onSetTurbo(true);
        }
        return;
      }

      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && !e.repeat) {
        e.preventDefault();
        if (phase === 'playing' || phase === 'paused') {
          c.onTogglePause();
        }
        return;
      }

      if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
        e.preventDefault();
        c.onToggleMute();
        return;
      }

      if ((e.key === 'c' || e.key === 'C') && !e.repeat) {
        e.preventDefault();
        c.onToggleShape();
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && !e.repeat) {
        e.preventDefault();
        c.onStartOrRestart();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        controlsRef.current.onSetTurbo(false);
      }
    };

    const onBlur = () => {
      controlsRef.current.onSetTurbo(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
