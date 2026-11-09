import type { CarShape, Difficulty } from './rules';

export interface Settings {
  highScore: number;
  muted: boolean;
  difficulty: Difficulty;
  playerShape: CarShape;
}

export const STORAGE_KEY = 'turbo-racer-dx99:v1';
const LEGACY_HISCORE_KEY = 'turbo_brick_racer_99_hiscore';

export const DEFAULT_SETTINGS: Settings = {
  highScore: 0,
  muted: false,
  difficulty: 'medium',
  playerShape: 'cross',
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const CAR_SHAPES: CarShape[] = ['cross', 'i-shape'];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && DIFFICULTIES.includes(value as Difficulty);
}

function isCarShape(value: unknown): value is CarShape {
  return typeof value === 'string' && CAR_SHAPES.includes(value as CarShape);
}

function parseHighScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

/**
 * Parses persisted settings without touching storage. Pure so it can be unit tested.
 * Falls back to the legacy hi-score key when no valid v1 high score exists.
 */
export function parseSettings(
  raw: string | null,
  legacyHighScore: string | null = null
): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const candidate = parsed as Partial<Record<keyof Settings, unknown>>;

        const highScore = parseHighScore(candidate.highScore);
        if (highScore !== null) settings.highScore = highScore;
        if (typeof candidate.muted === 'boolean') settings.muted = candidate.muted;
        if (isDifficulty(candidate.difficulty)) settings.difficulty = candidate.difficulty;
        if (isCarShape(candidate.playerShape)) settings.playerShape = candidate.playerShape;
      }
    } catch {
      // Corrupted payload: keep defaults.
    }
  }

  if (settings.highScore === 0 && legacyHighScore) {
    const legacy = Number.parseInt(legacyHighScore, 10);
    if (Number.isFinite(legacy) && legacy > 0) {
      settings.highScore = legacy;
    }
  }

  return settings;
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };

  try {
    return parseSettings(
      window.localStorage.getItem(STORAGE_KEY),
      window.localStorage.getItem(LEGACY_HISCORE_KEY)
    );
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: Settings = {
      ...settings,
      highScore: Math.max(0, Math.round(settings.highScore)),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or privacy-mode errors.
  }
}
