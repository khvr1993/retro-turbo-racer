import React from 'react';
import {
  CAR_SIZE,
  Difficulty,
  DIFFICULTY_SETTINGS,
  GameStateData,
  GridCell,
  GRID_ROWS,
  PLAYER_ROW,
} from '../game/rules';
import { EnemyCarSvg, PlayerCarSvg } from './CarSvg';

interface GridScreenProps {
  state: GameStateData;
  matrix: GridCell[][];
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onReturnTitle: () => void;
  onToggleShape: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const GridScreen: React.FC<GridScreenProps> = ({
  state,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onReturnTitle,
  onToggleShape,
  onSelectDifficulty,
}) => {
  // Calculate vertical percentage from logical 20-row grid
  const rowToTopPct = (row: number) => (row / GRID_ROWS) * 100;
  const carHeightPct = (CAR_SIZE / GRID_ROWS) * 100; // 15% of highway height

  // Lane horizontal center/left percentages inside the 3-lane asphalt track
  const laneToLeftPct = (lane: number) => lane * 33.3333;

  // Scrolling road dash offset synchronized with tickCount
  const roadScrollStep = ((state.tickCount % 4) + 4) % 4;

  return (
    <div
      className="relative rounded-xl bg-[#0b101b] p-3 sm:p-4 border-4 border-[#1e293b] shadow-[inset_0_4px_20px_rgba(0,0,0,0.85)]"
      data-testid="handheld-screen"
      data-turbo={state.isTurbo ? 'true' : 'false'}
      data-difficulty={state.difficulty}
    >
      {/* Top Bezel Screen Header */}
      <div className="flex items-center justify-between mb-2 px-1 text-[11px] font-mono-tabular tracking-wider text-slate-400">
        <span>
          MODE:{' '}
          <strong className="text-slate-200 uppercase">
            {DIFFICULTY_SETTINGS[state.difficulty].label}
          </strong>
        </span>
        <span className="text-amber-400 font-bold">
          {state.isTurbo ? 'TURBO NITRO 2X' : `GEAR LV.${state.level}`}
        </span>
      </div>

      {/* Main Screen Split: 3-Lane Highway Viewport on Left + Telemetry Side Strip on Right */}
      <div className="flex items-stretch gap-3">
        {/* Modern 3-Lane Asphalt Highway Viewport */}
        <div
          className="relative bg-[#0d1320] p-1.5 rounded-lg border-2 border-[#263248]"
          aria-label="3-Lane Highway Racing Track"
        >
          {/* Top Lane Header Labels */}
          <div className="grid grid-cols-10 gap-[3px] mb-1 text-[9px] font-mono-tabular text-center text-slate-400">
            <span className="col-span-3 border-b border-slate-700/70 pb-0.5">
              LANE 1
            </span>
            <span className="col-span-3 border-b border-slate-700/70 pb-0.5">
              LANE 2
            </span>
            <span className="col-span-3 border-b border-slate-700/70 pb-0.5">
              LANE 3
            </span>
            <span className="col-span-1 border-b border-amber-500/40 text-amber-400/80 pb-0.5">
              TR
            </span>
          </div>

          {/* Highway Canvas Container (matches 216x436 physical handheld viewport) */}
          <div
            className="relative overflow-hidden rounded-md bg-[#131926] border border-slate-800 flex"
            data-testid="highway-viewport"
            style={{ width: '216px', height: '436px' }}
          >
            {/* Left 90%: 3-Lane Asphalt Roadway */}
            <div className="relative w-[90%] h-full bg-[#161e2e] overflow-hidden">
              {/* Subtle Asphalt Texture & Speed Lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '100% 22px',
                  transform: `translateY(${roadScrollStep * 5.5}px)`,
                }}
              />

              {/* Left & Right Highway Shoulder Lines */}
              <div className="absolute left-[2px] top-0 bottom-0 w-[2px] bg-amber-400/40" />
              <div className="absolute right-[2px] top-0 bottom-0 w-[2px] bg-slate-400/35" />

              {/* Scrolling Dashed Lane Dividers between Lane 1 | Lane 2 | Lane 3 */}
              {[33.333, 66.666].map((leftPct, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-[2px] -ml-[1px] pointer-events-none flex flex-col justify-around"
                  style={{ left: `${leftPct}%` }}
                >
                  {Array.from({ length: 10 }).map((_, dashIdx) => {
                    const isLit = (dashIdx - roadScrollStep + 10) % 2 === 0;
                    return (
                      <div
                        key={dashIdx}
                        className={`w-full h-5 rounded-full transition-opacity duration-75 ${
                          isLit
                            ? state.isTurbo
                              ? 'bg-amber-300/80'
                              : 'bg-slate-400/60'
                            : 'bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Oncoming Traffic Cars */}
              {state.enemies.map((enemy) => {
                const topPct = rowToTopPct(enemy.row);
                const leftPct = laneToLeftPct(enemy.lane);
                return (
                  <div
                    key={enemy.id}
                    data-testid="enemy-car"
                    data-lane={enemy.lane}
                    data-color={enemy.color}
                    className="absolute px-1.5 transition-[top] duration-75 linear"
                    style={{
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      width: '33.3333%',
                      height: `${carHeightPct}%`,
                    }}
                  >
                    <EnemyCarSvg
                      color={enemy.color}
                      shape={enemy.shape}
                      className="w-full h-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.75)]"
                    />
                  </div>
                );
              })}

              {/* Player Supercar at Bottom */}
              <div
                data-testid="player-car"
                data-lane={state.playerLane}
                data-model={state.playerShape}
                className="absolute px-1.5 transition-[left] duration-150 ease-out z-10"
                style={{
                  top: `${rowToTopPct(PLAYER_ROW)}%`,
                  left: `${laneToLeftPct(state.playerLane)}%`,
                  width: '33.3333%',
                  height: `${carHeightPct}%`,
                }}
              >
                <PlayerCarSvg
                  model={state.playerShape}
                  isTurbo={state.isTurbo}
                  isCrashed={state.phase === 'gameover'}
                  className="w-full h-full drop-shadow-[0_6px_12px_rgba(16,185,129,0.35)]"
                />
              </div>

              {/* Collision Spark Burst Overlay on Crash */}
              {state.phase === 'gameover' && (
                <div
                  className="absolute z-20 pointer-events-none flex items-center justify-center animate-pulse"
                  style={{
                    top: `${rowToTopPct(PLAYER_ROW - 1)}%`,
                    left: `${laneToLeftPct(state.playerLane)}%`,
                    width: '33.3333%',
                    height: `${carHeightPct}%`,
                  }}
                >
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
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

            {/* Right 10%: Scrolling Racing Curb Strip */}
            <div className="w-[10%] h-full bg-[#0f1522] border-l border-slate-700/80 flex flex-col justify-between p-[2px]">
              {Array.from({ length: GRID_ROWS }).map((_, rIdx) => {
                const isLit = ((rIdx - state.tickCount) % 4 + 4) % 4 < 2;
                return (
                  <div
                    key={rIdx}
                    className={`w-full h-[18px] rounded-[2px] transition-colors duration-75 ${
                      isLit
                        ? state.isTurbo
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'bg-rose-500/90'
                        : 'bg-slate-800/80'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side Handheld LCD Telemetry Column */}
        <div className="flex flex-col justify-between w-28 sm:w-32 bg-[#111827] border border-[#243046] rounded-lg p-2.5 font-mono-tabular">
          <div className="space-y-2.5">
            {/* Score Readout */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                SCORE
              </div>
              <div
                className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-tight leading-none mt-0.5"
                data-testid="score-value"
              >
                {String(Math.round(state.score)).padStart(6, '0')}
              </div>
            </div>

            {/* High Score Readout */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                HI-SCORE
              </div>
              <div
                className="text-base font-bold text-amber-300 tracking-tight leading-none mt-0.5"
                data-testid="hiscore-value"
              >
                {String(Math.round(state.highScore)).padStart(6, '0')}
              </div>
            </div>

            {/* Cars Passed */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                CARS PASSED
              </div>
              <div
                className="text-base font-bold text-sky-300 leading-none mt-0.5"
                data-testid="passed-value"
              >
                {String(state.carsPassed).padStart(3, '0')}
              </div>
            </div>

            {/* Speed Level Meter */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>SPEED</span>
                <span className="text-slate-200 font-bold">
                  {state.level}/10
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 mt-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const active = i < state.level;
                  return (
                    <div
                      key={i}
                      className={`h-2 rounded-[1px] ${
                        active
                          ? state.isTurbo
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Player Supercar Model Preview & Selector */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
              <span>CAR</span>
              <span className="text-emerald-300 uppercase font-bold">
                {state.playerShape === 'cross' ? 'APEX GT' : 'F1 X-99'}
              </span>
            </div>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleShape();
              }}
              aria-label="Switch Player Car Model"
              className="w-full flex flex-col items-center justify-center py-2 bg-[#0b101b] hover:bg-[#162033] border border-slate-700/80 rounded-md transition-colors cursor-pointer"
            >
              <div className="w-10 h-12">
                <PlayerCarSvg
                  model={state.playerShape}
                  isTurbo={state.isTurbo}
                  className="w-full h-full"
                />
              </div>
              <span className="text-[10px] text-slate-300 mt-1 whitespace-nowrap">
                Switch [C]
              </span>
            </button>
          </div>

          {/* Active Lane & Turbo Telemetry */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-400">LANE POSITION</div>
            <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] text-center font-bold">
              {[0, 1, 2].map((laneIdx) => (
                <div
                  key={laneIdx}
                  className={`py-0.5 rounded ${
                    state.playerLane === laneIdx
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/60'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  L{laneIdx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screen-Fitted Modal Overlays for Title, Pause, and Game Over */}
      {state.phase === 'title' && (
        <div className="absolute inset-0 rounded-xl bg-[#090d16]/94 flex flex-col items-center justify-between p-4 sm:p-5 text-center z-20">
          <div className="text-[11px] font-mono-tabular tracking-widest text-amber-400 uppercase">
            MODERNIZED HANDHELD EDITION
          </div>

          <div className="flex flex-col items-center my-auto w-full">
            {/* Live Supercar Showcase + Title Lockup */}
            <div className="w-14 h-16 mb-1">
              <PlayerCarSvg
                model={state.playerShape}
                isTurbo={true}
                className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              />
            </div>

            <svg
              viewBox="0 0 260 56"
              className="w-56 h-12 mb-1"
              aria-hidden="true"
            >
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

            <p className="text-xs text-slate-300 max-w-[260px] leading-relaxed mb-3">
              Steer your supercar across 3 highway lanes. Select difficulty and
              hold <span className="text-amber-300 font-semibold">Turbo</span>{' '}
              to ignite afterburners.
            </p>

            {/* Pre-Game Difficulty Selector (Easy, Medium, Hard) */}
            <div className="w-full max-w-[270px] mb-4">
              <div className="text-[10px] font-mono-tabular text-slate-400 uppercase tracking-wider mb-1.5">
                SELECT DIFFICULTY
              </div>
              <div
                role="group"
                aria-label="Select Difficulty"
                className="grid grid-cols-3 gap-1.5 p-1 bg-[#111827] border border-slate-700/80 rounded-lg"
              >
                {DIFFICULTIES.map((diffKey) => {
                  const cfg = DIFFICULTY_SETTINGS[diffKey];
                  const isSelected = state.difficulty === diffKey;
                  return (
                    <button
                      key={diffKey}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectDifficulty(diffKey);
                      }}
                      className={`py-1.5 px-2 rounded-md text-xs font-mono-tabular font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? diffKey === 'easy'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : diffKey === 'medium'
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-rose-500 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] font-mono-tabular text-slate-400 mt-1">
                {state.difficulty === 'easy' &&
                  'Slower speed · Lower oncoming spawn rate'}
                {state.difficulty === 'medium' &&
                  'Standard speed · Balanced spawn rate (Default)'}
                {state.difficulty === 'hard' &&
                  'Fast speed · High oncoming traffic density'}
              </div>
            </div>

            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className="tactile-btn px-7 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base tracking-wide shadow-[0_4px_0_#047857] cursor-pointer whitespace-nowrap"
            >
              Start Race
            </button>
          </div>

          <div className="text-[11px] font-mono-tabular text-slate-400">
            ←/→ Change Lane · Space Turbo · P Pause
          </div>
        </div>
      )}

      {state.phase === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Game Paused"
          className="absolute inset-0 rounded-xl bg-[#090d16]/92 flex flex-col items-center justify-center p-5 text-center z-20"
        >
          <h2 className="font-display text-2xl font-bold text-amber-400 tracking-wide mb-1">
            RACE PAUSED
          </h2>
          <p className="text-xs text-slate-400 font-mono-tabular mb-5">
            {DIFFICULTY_SETTINGS[state.difficulty].label.toUpperCase()} · SCORE:{' '}
            {Math.round(state.score)} · PASSED: {state.carsPassed}
          </p>

          <div className="flex flex-col gap-2.5 w-48">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onResumeGame();
              }}
              className="tactile-btn py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-[0_3px_0_#047857] cursor-pointer whitespace-nowrap"
            >
              Resume Race
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestartGame();
              }}
              className="tactile-btn py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-600 cursor-pointer whitespace-nowrap"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onReturnTitle();
              }}
              className="tactile-btn py-2 px-4 rounded-lg text-slate-400 hover:text-slate-200 text-xs cursor-pointer whitespace-nowrap"
            >
              Title Screen
            </button>
          </div>
        </div>
      )}

      {state.phase === 'gameover' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Game Over"
          className="absolute inset-0 rounded-xl bg-[#090d16]/94 flex flex-col items-center justify-center p-4 sm:p-5 text-center z-20"
        >
          <div className="text-xs font-mono-tabular text-rose-400 tracking-widest uppercase mb-0.5">
            COLLISION DETECTED
          </div>
          <h2 className="font-display text-3xl font-bold text-white tracking-wide mb-3">
            GAME OVER
          </h2>

          <div className="grid grid-cols-2 gap-2 w-full max-w-[260px] mb-3 font-mono-tabular">
            <div className="bg-[#131c2e] border border-slate-700/80 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">FINAL SCORE</div>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                {Math.round(state.score)}
              </div>
            </div>
            <div className="bg-[#131c2e] border border-slate-700/80 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">HIGH SCORE</div>
              <div className="text-lg font-extrabold text-amber-300 mt-0.5">
                {Math.round(state.highScore)}
              </div>
            </div>
            <div className="bg-[#131c2e] border border-slate-700/80 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">CARS PASSED</div>
              <div className="text-base font-bold text-sky-300 mt-0.5">
                {state.carsPassed}
              </div>
            </div>
            <div className="bg-[#131c2e] border border-slate-700/80 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">DIFFICULTY</div>
              <div className="text-base font-bold text-rose-300 mt-0.5 uppercase">
                {DIFFICULTY_SETTINGS[state.difficulty].label}
              </div>
            </div>
          </div>

          {/* Allow changing difficulty before next run */}
          <div className="w-full max-w-[260px] mb-3">
            <div
              role="group"
              aria-label="Select Difficulty"
              className="grid grid-cols-3 gap-1.5 p-1 bg-[#111827] border border-slate-700/80 rounded-lg"
            >
              {DIFFICULTIES.map((diffKey) => {
                const cfg = DIFFICULTY_SETTINGS[diffKey];
                const isSelected = state.difficulty === diffKey;
                return (
                  <button
                    key={diffKey}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSelectDifficulty(diffKey);
                    }}
                    className={`py-1 px-2 rounded text-xs font-mono-tabular font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? diffKey === 'easy'
                          ? 'bg-emerald-500 text-slate-950'
                          : diffKey === 'medium'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-rose-500 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-48">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestartGame();
              }}
              className="tactile-btn py-2.5 px-5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-sm shadow-[0_4px_0_#b45309] cursor-pointer whitespace-nowrap"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onReturnTitle();
              }}
              className="tactile-btn py-1.5 px-4 rounded-lg text-slate-400 hover:text-slate-200 text-xs cursor-pointer whitespace-nowrap"
            >
              Title Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
