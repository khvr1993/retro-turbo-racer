import React from 'react';
import { CarShape, EnemyColor } from '../game/rules';

interface PlayerCarSvgProps {
  model: CarShape;
  isTurbo: boolean;
  isCrashed?: boolean;
  className?: string;
}

export const PlayerCarSvg: React.FC<PlayerCarSvgProps> = ({
  model,
  isTurbo,
  isCrashed = false,
  className = 'w-full h-full',
}) => {
  const primaryFill = isCrashed
    ? '#ef4444'
    : isTurbo
      ? '#f59e0b'
      : '#10b981';
  const secondaryFill = isCrashed
    ? '#991b1b'
    : isTurbo
      ? '#fde68a'
      : '#059669';
  const accentStripe = isTurbo ? '#ffffff' : '#6ee7b7';

  if (model === 'i-shape') {
    // Formula X-99 Open-Wheel Hypercar (facing UP)
    return (
      <svg
        viewBox="0 0 64 80"
        className={className}
        aria-label="Formula X-99 Player Car"
      >
        {/* Headlight Beams */}
        <path
          d="M18 8 L10 -12 L24 -12 Z"
          fill="url(#headlightGrad)"
          opacity={isTurbo ? 0.85 : 0.45}
        />
        <path
          d="M46 8 L40 -12 L54 -12 Z"
          fill="url(#headlightGrad)"
          opacity={isTurbo ? 0.85 : 0.45}
        />
        <defs>
          <linearGradient id="headlightGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Exposed Racing Slicks (4 Wheels) */}
        <rect x="4" y="14" width="10" height="17" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        <rect x="50" y="14" width="10" height="17" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        <rect x="3" y="47" width="11" height="20" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        <rect x="50" y="47" width="11" height="20" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

        {/* Suspension Arms */}
        <line x1="14" y1="22" x2="25" y2="24" stroke="#64748b" strokeWidth="2.5" />
        <line x1="50" y1="22" x2="39" y2="24" stroke="#64748b" strokeWidth="2.5" />
        <line x1="14" y1="57" x2="24" y2="55" stroke="#64748b" strokeWidth="3" />
        <line x1="50" y1="57" x2="40" y2="55" stroke="#64748b" strokeWidth="3" />

        {/* Front Splitter Wing */}
        <path
          d="M10 10 L54 10 L50 15 L14 15 Z"
          fill={secondaryFill}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Aero Nose & Sidepods */}
        <path
          d="M27 5 L37 5 L41 26 L47 34 L45 62 L38 70 L26 70 L19 62 L17 34 L23 26 Z"
          fill={primaryFill}
          stroke="#064e3b"
          strokeWidth="1.5"
        />

        {/* Center Racing Stripe */}
        <rect x="30" y="7" width="4" height="58" rx="1" fill={accentStripe} opacity="0.85" />

        {/* Driver Cockpit & Helmet */}
        <ellipse cx="32" cy="40" rx="6.5" ry="11" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.2" />
        <circle cx="32" cy="42" r="4.2" fill="#f8fafc" />
        <path d="M28.5 40 Q32 37 35.5 40" stroke="#0284c7" strokeWidth="2.2" fill="none" />

        {/* Rear Carbon Wing */}
        <rect
          x="12"
          y="65"
          width="40"
          height="7"
          rx="2"
          fill="#1e293b"
          stroke={accentStripe}
          strokeWidth="1.2"
        />

        {/* Twin Nitro Exhaust Flames when Turbo is Active */}
        {isTurbo && (
          <g>
            <path d="M25 72 L28 84 L31 72 Z" fill="#f97316" />
            <path d="M26.5 72 L28 80 L29.5 72 Z" fill="#fef08a" />
            <path d="M33 72 L36 84 L39 72 Z" fill="#f97316" />
            <path d="M34.5 72 L36 80 L37.5 72 Z" fill="#fef08a" />
          </g>
        )}
      </svg>
    );
  }

  // Default: Apex GT-R Supercar (facing UP)
  return (
    <svg
      viewBox="0 0 64 80"
      className={className}
      aria-label="Apex GT-R Player Supercar"
    >
      {/* Dual LED Headlight Cones */}
      <path
        d="M14 10 L7 -12 L22 -12 Z"
        fill="url(#gtHeadlight)"
        opacity={isTurbo ? 0.9 : 0.5}
      />
      <path
        d="M50 10 L42 -12 L57 -12 Z"
        fill="url(#gtHeadlight)"
        opacity={isTurbo ? 0.9 : 0.5}
      />
      <defs>
        <linearGradient id="gtHeadlight" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Recessed Tires */}
      <rect x="6" y="15" width="7" height="15" rx="2.5" fill="#090d16" />
      <rect x="51" y="15" width="7" height="15" rx="2.5" fill="#090d16" />
      <rect x="6" y="50" width="7" height="16" rx="2.5" fill="#090d16" />
      <rect x="51" y="50" width="7" height="16" rx="2.5" fill="#090d16" />

      {/* Side Mirrors */}
      <path d="M10 29 L4 27 L5 31 L10 32 Z" fill={primaryFill} />
      <path d="M54 29 L60 27 L59 31 L54 32 Z" fill={primaryFill} />

      {/* Main Sculpted Supercar Body */}
      <path
        d="M18 7 Q32 3 46 7 L53 18 L53 64 Q53 71 45 72 L19 72 Q11 71 11 64 L11 18 Z"
        fill={primaryFill}
        stroke="#ecfdf5"
        strokeWidth="1.4"
      />

      {/* Hood Aero Contours & Twin Racing Stripes */}
      <rect x="27" y="6" width="3.5" height="65" fill={accentStripe} opacity="0.85" />
      <rect x="33.5" y="6" width="3.5" height="65" fill={accentStripe} opacity="0.85" />
      <path d="M17 16 L24 23 M47 16 L40 23" stroke={secondaryFill} strokeWidth="2" strokeLinecap="round" />

      {/* Tinted Wrap-Around Windshield & Glass Roof */}
      <path
        d="M16 28 Q32 23 48 28 L45 40 Q32 38 19 40 Z"
        fill="#0f172a"
        stroke="#64748b"
        strokeWidth="1.2"
      />
      {/* Roof Panel */}
      <rect x="19" y="39" width="26" height="13" rx="3" fill={secondaryFill} />
      {/* Rear Engine Louvers / Window */}
      <path
        d="M20 52 L44 52 L42 63 L22 63 Z"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* LED Headlight Bars */}
      <path d="M14 11 L22 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 11 L42 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

      {/* Rear GT Spoiler Wing */}
      <rect x="12" y="66" width="40" height="4.5" rx="1.5" fill="#0f172a" stroke={accentStripe} strokeWidth="1" />

      {/* Taillight Strip */}
      <rect x="15" y="70.5" width="10" height="2" rx="1" fill="#f43f5e" />
      <rect x="39" y="70.5" width="10" height="2" rx="1" fill="#f43f5e" />

      {/* Dual Afterburner Exhaust Flames on Turbo */}
      {isTurbo && (
        <g>
          <path d="M21 72.5 L24 85 L27 72.5 Z" fill="#f97316" />
          <path d="M22.5 72.5 L24 81 L25.5 72.5 Z" fill="#fef08a" />
          <path d="M37 72.5 L40 85 L43 72.5 Z" fill="#f97316" />
          <path d="M38.5 72.5 L40 81 L41.5 72.5 Z" fill="#fef08a" />
        </g>
      )}
    </svg>
  );
};

interface EnemyCarSvgProps {
  color: EnemyColor;
  shape: CarShape;
  className?: string;
}

export const EnemyCarSvg: React.FC<EnemyCarSvgProps> = ({
  color,
  shape,
  className = 'w-full h-full',
}) => {
  const palette =
    color === 'rose'
      ? {
          body: '#f43f5e',
          trim: '#be123c',
          stripe: '#fda4af',
          light: '#fef08a',
        }
      : color === 'amber'
        ? {
            body: '#f97316',
            trim: '#c2410c',
            stripe: '#fed7aa',
            light: '#fef08a',
          }
        : {
            body: '#0ea5e9',
            trim: '#0369a1',
            stripe: '#bae6fd',
            light: '#e0f2fe',
          };

  // Oncoming traffic faces DOWNWARD toward the player!
  return (
    <svg
      viewBox="0 0 64 80"
      className={className}
      aria-label={`Oncoming ${color} race car`}
    >
      {/* Recessed Tires */}
      <rect x="6" y="14" width="7" height="15" rx="2.5" fill="#090d16" />
      <rect x="51" y="14" width="7" height="15" rx="2.5" fill="#090d16" />
      <rect x="6" y="50" width="7" height="15" rx="2.5" fill="#090d16" />
      <rect x="51" y="50" width="7" height="15" rx="2.5" fill="#090d16" />

      {/* Main Sculpted Chassis (facing down) */}
      <path
        d="M19 8 Q11 9 11 16 L11 62 L18 73 Q32 77 46 73 L53 62 L53 16 Q53 9 45 8 Z"
        fill={palette.body}
        stroke={palette.stripe}
        strokeWidth="1.3"
      />

      {/* Center Hood / Roof Racing Stripe */}
      {shape === 'cross' ? (
        <rect x="29.5" y="9" width="5" height="64" fill={palette.stripe} opacity="0.8" />
      ) : (
        <>
          <rect x="26" y="9" width="3" height="64" fill={palette.stripe} opacity="0.75" />
          <rect x="35" y="9" width="3" height="64" fill={palette.stripe} opacity="0.75" />
        </>
      )}

      {/* Rear Window (Top side of downward-facing car) */}
      <path
        d="M21 15 L43 15 L45 26 L19 26 Z"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* Cabin Roof (with Police/Interceptor Lightbar for Cyan Cruiser) */}
      <rect x="19" y="26" width="26" height="14" rx="3" fill={palette.trim} />
      {color === 'cyan' && (
        <g>
          <rect x="21" y="30" width="10" height="4.5" rx="1" fill="#ef4444" />
          <rect x="33" y="30" width="10" height="4.5" rx="1" fill="#38bdf8" />
        </g>
      )}

      {/* Front Windshield (Bottom side of downward-facing car) */}
      <path
        d="M19 40 Q32 42 45 40 L48 52 Q32 57 16 52 Z"
        fill="#0f172a"
        stroke="#64748b"
        strokeWidth="1.2"
      />

      {/* Hood Scoop / Intake */}
      <rect x="25" y="56" width="14" height="8" rx="2" fill={palette.trim} />

      {/* Glowing Downward Headlights */}
      <path d="M14 69 L22 71" stroke={palette.light} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M50 69 L42 71" stroke={palette.light} strokeWidth="2.8" strokeLinecap="round" />

      {/* Downward Headlight Cones */}
      <path d="M14 71 L9 84 L22 84 Z" fill={palette.light} opacity="0.3" />
      <path d="M50 71 L42 84 L55 84 Z" fill={palette.light} opacity="0.3" />
    </svg>
  );
};
