import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceGameTick,
  buildGridMatrix,
  CarShape,
  createInitialState,
  Difficulty,
  DIFFICULTY_SETTINGS,
  GamePhase,
  GameStateData,
  getTickIntervalMs,
  moveLane,
} from '../game/rules';
import { soundEngine } from '../game/sound';
import { GridScreen } from './GridScreen';
import { OfflineIndicator, PWAInstallButton } from './PWAInstallButton';

const HIGH_SCORE_STORAGE_KEY = 'turbo_brick_racer_99_hiscore';

function loadSavedHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(Math.round(score)));
  } catch {
    // Ignore storage quota errors
  }
}

export const HandheldConsole: React.FC = () => {
  const initialPhase: GamePhase = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  }, []);

  const [gameState, setGameState] = useState<GameStateData>(() =>
    createInitialState(loadSavedHighScore(), 'cross', initialPhase, 'medium')
  );
  const [muted, setMuted] = useState(false);
  const [hapticPulse, setHapticPulse] = useState<'left' | 'right' | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Sync document.body.dataset.state, turbo, and difficulty
  useEffect(() => {
    document.body.dataset.state = gameState.phase;
    document.body.dataset.turbo = gameState.isTurbo ? 'true' : 'false';
    document.body.dataset.difficulty = gameState.difficulty;
  }, [gameState.phase, gameState.isTurbo, gameState.difficulty]);

  // Save high score whenever it updates
  useEffect(() => {
    if (gameState.highScore > 0) {
      saveHighScore(gameState.highScore);
    }
  }, [gameState.highScore]);

  const triggerButtonHapticFeedback = useCallback(
    (direction: 'left' | 'right', blocked: boolean) => {
      soundEngine.playTactileThump(direction, blocked);
      setHapticPulse(direction);
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      pulseTimeoutRef.current = window.setTimeout(() => {
        setHapticPulse(null);
      }, 130);
    },
    []
  );

  const handleSelectDifficulty = useCallback((difficulty: Difficulty) => {
    soundEngine.playLaneChange(
      difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
    );
    setGameState((prev) => ({
      ...prev,
      difficulty,
    }));
  }, []);

  const handleStartOrRestart = useCallback(() => {
    soundEngine.playStart();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState((prev) => ({
      ...createInitialState(
        prev.highScore,
        prev.playerShape,
        'playing',
        prev.difficulty
      ),
      enemies: [
        {
          id: 1,
          lane: 0,
          row: -2,
          shape: 'i-shape',
          color: 'cyan',
          passed: false,
        },
      ],
      nextEnemyId: 2,
    }));
  }, []);

  const handleResume = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState((prev) =>
      prev.phase === 'paused' ? { ...prev, phase: 'playing', isTurbo: false } : prev
    );
  }, []);

  const handleTogglePause = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState((prev) => {
      if (prev.phase === 'playing') {
        if (prev.isTurbo) {
          soundEngine.playTurboDeactivate();
        }
        return { ...prev, phase: 'paused', isTurbo: false };
      }
      if (prev.phase === 'paused') {
        return { ...prev, phase: 'playing', isTurbo: false };
      }
      return prev;
    });
  }, []);

  const handleReturnTitle = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState((prev) =>
      createInitialState(
        prev.highScore,
        prev.playerShape,
        'title',
        prev.difficulty
      )
    );
  }, []);

  const handleShiftLane = useCallback(
    (delta: -1 | 1) => {
      const direction = delta === -1 ? 'left' : 'right';
      const current = stateRef.current;
      const nextLane = moveLane(current.playerLane, delta);
      const blocked = current.phase !== 'playing' || nextLane === current.playerLane;

      // Always deliver tactile haptic & visual button feedback when Left/Right is pressed
      triggerButtonHapticFeedback(direction, blocked);

      if (current.phase !== 'playing') return;
      if (nextLane !== current.playerLane) {
        soundEngine.playLaneChange(nextLane);
        setGameState((prev) => ({ ...prev, playerLane: nextLane }));
      }
    },
    [triggerButtonHapticFeedback]
  );

  const handleSetTurbo = useCallback((active: boolean) => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') {
        if (prev.isTurbo) {
          soundEngine.playTurboDeactivate();
          return { ...prev, isTurbo: false };
        }
        return prev;
      }
      if (prev.isTurbo === active) return prev;
      if (active) {
        soundEngine.playTurboActivate();
      } else {
        soundEngine.playTurboDeactivate();
      }
      return { ...prev, isTurbo: active };
    });
  }, []);

  const handleToggleShape = useCallback(() => {
    soundEngine.playLaneChange(1);
    setGameState((prev) => {
      const nextShape: CarShape =
        prev.playerShape === 'cross' ? 'i-shape' : 'cross';
      return { ...prev, playerShape: nextShape };
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.muted = next;
      return next;
    });
  }, []);

  // Main game loop tick timer
  useEffect(() => {
    if (gameState.phase !== 'playing') return;

    const intervalMs = getTickIntervalMs(
      gameState.level,
      gameState.isTurbo,
      gameState.difficulty
    );
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (current.phase !== 'playing') return;

      const {
        nextState,
        justCrashed,
        newlyPassedCount,
        spawnedCount,
        leveledUp,
      } = advanceGameTick(current);

      if (justCrashed) {
        soundEngine.playGameOver();
      } else {
        if (leveledUp) {
          soundEngine.playLevelUp();
        } else if (newlyPassedCount > 0) {
          soundEngine.playPassCar();
        } else if (spawnedCount > 0) {
          soundEngine.playEnemySpawn(spawnedCount);
        } else {
          soundEngine.playTick(current.isTurbo, current.level);
        }
      }

      setGameState(nextState);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [gameState.phase, gameState.level, gameState.isTurbo, gameState.difficulty]);

  // Global keyboard listener for ArrowLeft, ArrowRight, Space (Turbo), Enter, P/Escape, M, C, R, 1/2/3
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const currentPhase = stateRef.current.phase;

      if (e.key === '1' && (currentPhase === 'title' || currentPhase === 'gameover')) {
        handleSelectDifficulty('easy');
        return;
      }
      if (e.key === '2' && (currentPhase === 'title' || currentPhase === 'gameover')) {
        handleSelectDifficulty('medium');
        return;
      }
      if (e.key === '3' && (currentPhase === 'title' || currentPhase === 'gameover')) {
        handleSelectDifficulty('hard');
        return;
      }

      if (e.key === 'Enter' && !e.repeat) {
        if (currentPhase === 'title' || currentPhase === 'gameover') {
          e.preventDefault();
          handleStartOrRestart();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (currentPhase === 'title' && !e.repeat) {
          handleStartOrRestart();
        } else if (currentPhase === 'playing' && !e.repeat) {
          handleSetTurbo(true);
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (!e.repeat) {
          handleShiftLane(-1);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (!e.repeat) {
          handleShiftLane(1);
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (currentPhase === 'playing' && !e.repeat) {
          handleSetTurbo(true);
        }
        return;
      }

      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && !e.repeat) {
        e.preventDefault();
        if (currentPhase === 'playing' || currentPhase === 'paused') {
          handleTogglePause();
        }
        return;
      }

      if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if ((e.key === 'c' || e.key === 'C') && !e.repeat) {
        e.preventDefault();
        handleToggleShape();
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && !e.repeat) {
        e.preventDefault();
        handleStartOrRestart();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleSetTurbo(false);
      }
    };

    const onBlur = () => {
      handleSetTurbo(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    handleStartOrRestart,
    handleShiftLane,
    handleSetTurbo,
    handleTogglePause,
    handleToggleMute,
    handleToggleShape,
    handleSelectDifficulty,
  ]);

  const matrix = useMemo(() => buildGridMatrix(gameState), [gameState]);
  const activeTickMs = getTickIntervalMs(
    gameState.level,
    gameState.isTurbo,
    gameState.difficulty
  );

  return (
    <main className="min-h-screen w-full bg-[#090d16] text-slate-100 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 px-4 py-4">
      <OfflineIndicator />

      {/* Left Desktop Wing: Tactical Telemetry & Lane Map */}
      <aside className="hidden lg:flex flex-col justify-between w-64 space-y-6">
        <div>
          <div className="text-xs font-mono-tabular text-amber-400 tracking-widest uppercase">
            MODERNIZED HANDHELD RACER
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight mt-1 whitespace-nowrap">
            TURBO RACER DX-99
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            High-speed 3-lane highway racing inside a classic handheld shell.
            Steer your supercar through oncoming traffic and ignite Turbo.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800/80 font-mono-tabular text-xs">
          <div className="text-slate-300 font-semibold uppercase tracking-wider">
            VEHICLE & TRAFFIC LINEUP
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Player Supercar</span>
            <span className="text-emerald-400 font-bold">Apex GT / F1 X-99</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Turbo Afterburner</span>
            <span className="text-amber-300 font-bold">Solar Gold 2×</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Diavolo Coupe</span>
            <span className="text-rose-400 font-bold">Crimson Exotic</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Highway Interceptor</span>
            <span className="text-sky-400 font-bold">Cyan Cruiser</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Titan V8 Fastback</span>
            <span className="text-orange-400 font-bold">Amber Muscle</span>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-800/80 font-mono-tabular text-xs text-slate-400">
          <div className="text-slate-300 font-semibold uppercase tracking-wider">
            DIFFICULTY MODES
          </div>
          <div>Easy: Slower Speed · Wide Gaps</div>
          <div>Medium: Balanced Speed (Default)</div>
          <div>Hard: Fast Speed · High Traffic</div>
        </div>
      </aside>

      {/* Centerpiece: Nostalgic Molded Handheld Console Shell */}
      <section
        aria-label="Brick Racing Handheld Console"
        className="relative flex flex-col items-center bg-[#1e293b] border-4 border-[#334155] rounded-[36px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_2px_0_rgba(255,255,255,0.12)] max-w-[430px] w-full"
      >
        {/* Top Handheld Speaker Grille, Moulded Branding & Android PWA Install Button */}
        <div className="w-full flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-wider text-slate-200">
              TURBO RACER
            </span>
            <span className="text-xs font-mono-tabular text-amber-400 font-bold">
              DX-99
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            {/* Molded Speaker Slots */}
            <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-3.5 rounded-full bg-[#0f172a] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Top Console Utility Row: Start/Pause, Sound, Car Model, Reset (Moved to Top) */}
        <div
          className="w-full grid grid-cols-4 gap-2 mb-3.5 px-1"
          data-testid="top-utility-row"
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              if (gameState.phase === 'title' || gameState.phase === 'gameover') {
                handleStartOrRestart();
              } else {
                handleTogglePause();
              }
            }}
            aria-label={
              gameState.phase === 'playing' ? 'Pause Game' : 'Start or Resume Game'
            }
            className="tactile-btn flex flex-col items-center justify-center py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#16223b] border border-slate-600 text-[10px] font-mono-tabular text-slate-200 shadow-[0_3px_0_#090d16] cursor-pointer whitespace-nowrap"
          >
            <span className="font-bold text-emerald-400">
              {gameState.phase === 'playing' ? 'PAUSE' : 'START'}
            </span>
            <span className="text-[9px] text-slate-400">[P]</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              handleToggleMute();
            }}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="tactile-btn flex flex-col items-center justify-center py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#16223b] border border-slate-600 text-[10px] font-mono-tabular text-slate-200 shadow-[0_3px_0_#090d16] cursor-pointer whitespace-nowrap"
          >
            <span className="font-bold text-sky-300">
              {muted ? 'MUTED' : 'SOUND'}
            </span>
            <span className="text-[9px] text-slate-400">[M]</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              handleToggleShape();
            }}
            aria-label="Toggle Car Shape"
            className="tactile-btn flex flex-col items-center justify-center py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#16223b] border border-slate-600 text-[10px] font-mono-tabular text-slate-200 shadow-[0_3px_0_#090d16] cursor-pointer whitespace-nowrap"
          >
            <span className="font-bold text-amber-300">CAR</span>
            <span className="text-[9px] text-slate-400">[C]</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              handleStartOrRestart();
            }}
            aria-label="Reset Game"
            className="tactile-btn flex flex-col items-center justify-center py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#16223b] border border-slate-600 text-[10px] font-mono-tabular text-slate-200 shadow-[0_3px_0_#090d16] cursor-pointer whitespace-nowrap"
          >
            <span className="font-bold text-rose-400">STOP/RST</span>
            <span className="text-[9px] text-slate-400">[R]</span>
          </button>
        </div>

        {/* Highway Viewport + Side LCD Screen */}
        <GridScreen
          state={gameState}
          matrix={matrix}
          onStartGame={handleStartOrRestart}
          onResumeGame={handleResume}
          onRestartGame={handleStartOrRestart}
          onReturnTitle={handleReturnTitle}
          onToggleShape={handleToggleShape}
          onSelectDifficulty={handleSelectDifficulty}
        />

        {/* Lower Tactile Controls Deck: Extra-Large Left/Right Steering Buttons with Haptic Feedback + Turbo Boost */}
        <div className="w-full flex flex-col gap-3 mt-4 px-1">
          {/* Oversized Left & Right Lane Steering Buttons with Haptic Pulse */}
          <div className="grid grid-cols-2 gap-3.5 w-full">
            <button
              type="button"
              tabIndex={-1}
              data-haptic-active={hapticPulse === 'left' ? 'true' : 'false'}
              onClick={(e) => {
                e.currentTarget.blur();
                handleShiftLane(-1);
              }}
              aria-label="Move Left Lane"
              className={`tactile-btn h-20 rounded-2xl border-2 flex items-center justify-center gap-2.5 shadow-[0_6px_0_#090d16] cursor-pointer transition-all duration-100 ${
                hapticPulse === 'left'
                  ? 'bg-emerald-500/25 border-emerald-400 translate-y-[2px] shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                  : 'bg-[#0f172a] hover:bg-[#172542] active:bg-slate-800 border-slate-400/80'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-9 h-9 text-emerald-400 shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M15.5 5l-7 7 7 7V5z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="font-display text-lg font-bold text-white tracking-wider leading-none">
                  LEFT
                </span>
                <span className="text-[10px] font-mono-tabular text-emerald-300/90 mt-1">
                  STEER · HAPTIC
                </span>
              </div>
            </button>

            <button
              type="button"
              tabIndex={-1}
              data-haptic-active={hapticPulse === 'right' ? 'true' : 'false'}
              onClick={(e) => {
                e.currentTarget.blur();
                handleShiftLane(1);
              }}
              aria-label="Move Right Lane"
              className={`tactile-btn h-20 rounded-2xl border-2 flex items-center justify-center gap-2.5 shadow-[0_6px_0_#090d16] cursor-pointer transition-all duration-100 ${
                hapticPulse === 'right'
                  ? 'bg-emerald-500/25 border-emerald-400 translate-y-[2px] shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                  : 'bg-[#0f172a] hover:bg-[#172542] active:bg-slate-800 border-slate-400/80'
              }`}
            >
              <div className="flex flex-col items-end">
                <span className="font-display text-lg font-bold text-white tracking-wider leading-none">
                  RIGHT
                </span>
                <span className="text-[10px] font-mono-tabular text-emerald-300/90 mt-1">
                  HAPTIC · STEER
                </span>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="w-9 h-9 text-emerald-400 shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8.5 5l7 7-7 7V5z" />
              </svg>
            </button>
          </div>

          {/* Full-Width TURBO Hold Bar below Left/Right */}
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.currentTarget.blur();
              handleSetTurbo(true);
            }}
            onMouseUp={() => handleSetTurbo(false)}
            onMouseLeave={() => handleSetTurbo(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSetTurbo(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleSetTurbo(false);
            }}
            aria-label="Hold Turbo Boost"
            className={`tactile-btn w-full h-14 rounded-2xl font-display font-bold text-slate-950 border-2 flex items-center justify-center gap-3 shadow-[0_5px_0_#b45309] cursor-pointer transition-colors ${
              gameState.isTurbo
                ? 'bg-amber-300 border-white translate-y-[2px]'
                : 'bg-amber-400 hover:bg-amber-300 border-amber-200'
            }`}
          >
            <span className="text-lg tracking-wider leading-none">
              TURBO AFTERBURNER
            </span>
            <span className="text-xs font-mono-tabular font-bold text-slate-900 whitespace-nowrap">
              [HOLD SPACE]
            </span>
          </button>
        </div>
      </section>

      {/* Right Desktop Wing: Controls Reference & Live Audio/Difficulty Telemetry */}
      <aside className="hidden lg:flex flex-col justify-between w-64 space-y-6 font-mono-tabular text-xs">
        <div className="space-y-3">
          <div className="text-slate-300 font-semibold uppercase tracking-wider">
            KEYBOARD BINDINGS
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Switch Lane Left</span>
            <span className="text-slate-200 font-bold">← / A</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Switch Lane Right</span>
            <span className="text-slate-200 font-bold">→ / D</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Hold Turbo Boost</span>
            <span className="text-amber-300 font-bold">Space / ↑</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Difficulty (Menu)</span>
            <span className="text-slate-200 font-bold">1 / 2 / 3</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Pause / Resume</span>
            <span className="text-slate-200 font-bold">P / Esc</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Switch Supercar</span>
            <span className="text-slate-200 font-bold">C</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Mute Synth & Haptics</span>
            <span className="text-slate-200 font-bold">M</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="text-slate-300 font-semibold uppercase tracking-wider">
            LIVE TELEMETRY
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Active Difficulty</span>
            <span className="text-amber-300 font-bold uppercase">
              {DIFFICULTY_SETTINGS[gameState.difficulty].label}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Android / PWA</span>
            <span className="text-emerald-400 font-bold">Standalone Ready</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Tick Interval</span>
            <span
              className="text-emerald-400 font-bold"
              data-testid="tick-interval"
            >
              {activeTickMs} ms
            </span>
          </div>
        </div>
      </aside>
    </main>
  );
};


