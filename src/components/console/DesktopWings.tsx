import React from 'react';
import { DIFFICULTY_SETTINGS, type Difficulty } from '../../game/rules';

interface WingProps {
  difficulty: Difficulty;
  tickMs: number;
}

export const LeftWing: React.FC<WingProps> = ({ difficulty }) => {
  return (
    <aside className="hidden w-64 flex-col justify-between space-y-6 lg:flex">
      <div>
        <div className="text-xs font-mono-tabular uppercase tracking-widest text-amber-400">
          MODERNIZED HANDHELD RACER
        </div>
        <h1 className="mt-1 whitespace-nowrap font-display text-2xl font-bold tracking-tight text-white">
          TURBO RACER DX-99
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          High-speed 3-lane highway racing inside a classic handheld shell. Steer
          your supercar through oncoming traffic and ignite Turbo.
        </p>
      </div>

      <div className="space-y-3 border-t border-slate-800/80 pt-4 font-mono-tabular text-xs">
        <div className="font-semibold uppercase tracking-wider text-slate-300">
          VEHICLE &amp; TRAFFIC LINEUP
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Player Supercar</span>
          <span className="font-bold text-emerald-400">Apex GT / F1 X-99</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Turbo Afterburner</span>
          <span className="font-bold text-amber-300">Solar Gold 2×</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Diavolo Coupe</span>
          <span className="font-bold text-rose-400">Crimson Exotic</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Highway Interceptor</span>
          <span className="font-bold text-sky-400">Cyan Cruiser</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Titan V8 Fastback</span>
          <span className="font-bold text-orange-400">Amber Muscle</span>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-800/80 pt-4 font-mono-tabular text-xs text-slate-400">
        <div className="font-semibold uppercase tracking-wider text-slate-300">
          DIFFICULTY MODES
        </div>
        <div>Easy: Slower Speed · Wide Gaps</div>
        <div>Medium: Balanced Speed (Default)</div>
        <div>Hard: Fast Speed · High Traffic</div>
        <div className="pt-1 text-slate-300">
          ACTIVE:{' '}
          <span className="font-bold uppercase text-amber-300">
            {DIFFICULTY_SETTINGS[difficulty].label}
          </span>
        </div>
      </div>
    </aside>
  );
};

export const RightWing: React.FC<WingProps> = ({ difficulty, tickMs }) => {
  return (
    <aside className="hidden w-64 flex-col justify-between space-y-6 font-mono-tabular text-xs lg:flex">
      <div className="space-y-3">
        <div className="font-semibold uppercase tracking-wider text-slate-300">
          KEYBOARD BINDINGS
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Switch Lane Left</span>
          <span className="font-bold text-slate-200">← / A</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Switch Lane Right</span>
          <span className="font-bold text-slate-200">→ / D</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Hold Turbo Boost</span>
          <span className="font-bold text-amber-300">Space / ↑</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Difficulty (Menu)</span>
          <span className="font-bold text-slate-200">1 / 2 / 3</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Pause / Resume</span>
          <span className="font-bold text-slate-200">P / Esc</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Switch Supercar</span>
          <span className="font-bold text-slate-200">C</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
          <span className="text-slate-400">Mute Synth &amp; Haptics</span>
          <span className="font-bold text-slate-200">M</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="font-semibold uppercase tracking-wider text-slate-300">
          LIVE TELEMETRY
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Active Difficulty</span>
          <span className="font-bold uppercase text-amber-300">
            {DIFFICULTY_SETTINGS[difficulty].label}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Android / PWA</span>
          <span className="font-bold text-emerald-400">Standalone Ready</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Tick Interval</span>
          <span className="font-bold text-emerald-400" data-testid="tick-interval">
            {tickMs} ms
          </span>
        </div>
      </div>
    </aside>
  );
};
