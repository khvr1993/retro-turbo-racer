import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  advanceGameTick,
  createInitialState,
  createRunningState,
  getTickIntervalMs,
  moveLane,
  type CarShape,
  type Difficulty,
  type GamePhase,
  type GameStateData,
} from '../game/rules';
import { loadSettings, saveSettings } from '../game/storage';
import { soundEngine } from '../game/sound';
import { useGameLoop } from '../game/useGameLoop';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { GridScreen } from './GridScreen';
import { OfflineIndicator, PWAInstallButton } from './PWAInstallButton';
import { ControlDeck } from './console/ControlDeck';
import { LeftWing, RightWing } from './console/DesktopWings';
import { UtilityRow } from './console/UtilityRow';

function getInitialPhase(): GamePhase {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'playing';
    }
  }
  return 'title';
}

export const HandheldConsole: React.FC = () => {
  const [initialSettings] = useState(loadSettings);
  const [initialPhase] = useState(getInitialPhase);
  const [gameState, setGameState] = useState<GameStateData>(() =>
    initialPhase === 'playing'
      ? createRunningState(
          initialSettings.highScore,
          initialSettings.playerShape,
          initialSettings.difficulty
        )
      : createInitialState(
          initialSettings.highScore,
          initialSettings.playerShape,
          initialPhase,
          initialSettings.difficulty
        )
  );
  const [muted, setMuted] = useState(initialSettings.muted);
  const [hapticPulse, setHapticPulse] = useState<'left' | 'right' | null>(null);

  const stateRef = useRef(gameState);
  const pulseTimeoutRef = useRef<number | null>(null);
  const lastSavedAtRef = useRef(0);
  const settingsRef = useRef({
    highScore: gameState.highScore,
    muted,
    difficulty: gameState.difficulty,
    playerShape: gameState.playerShape,
  });

  useLayoutEffect(() => {
    stateRef.current = gameState;
    settingsRef.current = {
      highScore: gameState.highScore,
      muted,
      difficulty: gameState.difficulty,
      playerShape: gameState.playerShape,
    };
  }, [gameState, muted]);

  // Telemetry hooks consumed by tests and debugging tools.
  useEffect(() => {
    document.body.dataset.state = gameState.phase;
    document.body.dataset.turbo = gameState.isTurbo ? 'true' : 'false';
    document.body.dataset.difficulty = gameState.difficulty;
  }, [gameState.phase, gameState.isTurbo, gameState.difficulty]);

  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  // Persist at most once per second during a race, immediately on phase changes.
  useEffect(() => {
    const now = Date.now();
    const shouldFlush =
      gameState.phase !== 'playing' || now - lastSavedAtRef.current >= 1000;
    if (!shouldFlush) return;

    lastSavedAtRef.current = now;
    saveSettings(settingsRef.current);
  }, [
    gameState.phase,
    gameState.highScore,
    gameState.difficulty,
    gameState.playerShape,
    muted,
  ]);

  useEffect(() => {
    const flush = () => saveSettings(settingsRef.current);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flush();
    };
  }, []);

  useEffect(
    () => () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    },
    []
  );

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
    setGameState((prev) => ({ ...prev, difficulty }));
  }, []);

  const handleStartOrRestart = useCallback(() => {
    soundEngine.playStart();
    setGameState((prev) =>
      createRunningState(prev.highScore, prev.playerShape, prev.difficulty)
    );
  }, []);

  const handleResume = useCallback(() => {
    setGameState((prev) =>
      prev.phase === 'paused' ? { ...prev, phase: 'playing', isTurbo: false } : prev
    );
  }, []);

  const handleTogglePause = useCallback(() => {
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
    setGameState((prev) =>
      createInitialState(prev.highScore, prev.playerShape, 'title', prev.difficulty)
    );
  }, []);

  const handleShiftLane = useCallback(
    (delta: -1 | 1) => {
      const direction = delta === -1 ? 'left' : 'right';
      const current = stateRef.current;
      const nextLane = moveLane(current.playerLane, delta);
      const blocked = current.phase !== 'playing' || nextLane === current.playerLane;

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
    setMuted((prev) => !prev);
  }, []);

  const handleTick = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== 'playing') return;

    const result = advanceGameTick(current);

    if (result.justCrashed) {
      soundEngine.playGameOver();
    } else if (result.leveledUp) {
      soundEngine.playLevelUp();
    } else if (result.newlyPassedCount > 0) {
      soundEngine.playPassCar();
    } else if (result.spawnedCount > 0) {
      soundEngine.playEnemySpawn(result.spawnedCount);
    } else {
      soundEngine.playTick(current.isTurbo, current.level);
    }

    // Write synchronously: catch-up ticks in the same frame must see fresh state.
    stateRef.current = result.nextState;
    setGameState(result.nextState);
  }, []);

  const getStepMs = useCallback(
    () =>
      getTickIntervalMs(
        stateRef.current.level,
        stateRef.current.isTurbo,
        stateRef.current.difficulty
      ),
    []
  );

  useGameLoop(gameState.phase, getStepMs, handleTick);

  useKeyboardControls({
    getPhase: () => stateRef.current.phase,
    onStartOrRestart: handleStartOrRestart,
    onTogglePause: handleTogglePause,
    onShiftLane: handleShiftLane,
    onSetTurbo: handleSetTurbo,
    onToggleMute: handleToggleMute,
    onToggleShape: handleToggleShape,
    onSelectDifficulty: handleSelectDifficulty,
  });

  const activeTickMs = getTickIntervalMs(
    gameState.level,
    gameState.isTurbo,
    gameState.difficulty
  );

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[var(--surface-base)] px-4 py-4 text-slate-100 lg:flex-row lg:gap-12">
      <OfflineIndicator />

      <LeftWing difficulty={gameState.difficulty} tickMs={activeTickMs} />

      <section
        aria-label="Turbo Racer Handheld Console"
        className="relative flex w-full max-w-[430px] flex-col items-center rounded-[36px] border-4 border-[#334155] bg-[#1e293b] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_2px_0_rgba(255,255,255,0.12)] sm:p-6"
      >
        <div className="mb-2.5 flex w-full items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-wider text-slate-200">
              TURBO RACER
            </span>
            <span className="font-mono-tabular text-xs font-bold text-amber-400">
              DX-99
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            <div className="hidden items-center gap-1 sm:flex" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 w-1 rounded-full bg-[#0f172a] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]"
                />
              ))}
            </div>
          </div>
        </div>

        <UtilityRow
          phase={gameState.phase}
          muted={muted}
          onPrimary={() => {
            if (gameState.phase === 'title' || gameState.phase === 'gameover') {
              handleStartOrRestart();
            } else {
              handleTogglePause();
            }
          }}
          onToggleMute={handleToggleMute}
          onToggleShape={handleToggleShape}
          onRestart={handleStartOrRestart}
        />

        <GridScreen
          state={gameState}
          onStartGame={handleStartOrRestart}
          onResumeGame={handleResume}
          onRestartGame={handleStartOrRestart}
          onReturnTitle={handleReturnTitle}
          onToggleShape={handleToggleShape}
          onSelectDifficulty={handleSelectDifficulty}
          onShiftLane={handleShiftLane}
        />

        <ControlDeck
          isTurbo={gameState.isTurbo}
          hapticPulse={hapticPulse}
          onShiftLane={handleShiftLane}
          onSetTurbo={handleSetTurbo}
        />
      </section>

      <RightWing difficulty={gameState.difficulty} tickMs={activeTickMs} />
    </main>
  );
};
