import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './storage';

describe('parseSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults for corrupted JSON', () => {
    expect(parseSettings('{not-json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('accepts valid persisted fields and rejects invalid ones', () => {
    const parsed = parseSettings(
      JSON.stringify({
        highScore: 1234.6,
        muted: true,
        difficulty: 'hard',
        playerShape: 'i-shape',
      })
    );

    expect(parsed).toEqual({
      highScore: 1235,
      muted: true,
      difficulty: 'hard',
      playerShape: 'i-shape',
    });

    const invalid = parseSettings(
      JSON.stringify({
        highScore: -20,
        muted: 'yes',
        difficulty: 'impossible',
        playerShape: 'boat',
      })
    );

    expect(invalid).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates the legacy hi-score when no v1 high score exists', () => {
    const parsed = parseSettings(null, '4200');
    expect(parsed.highScore).toBe(4200);
  });

  it('prefers the v1 high score over the legacy value', () => {
    const parsed = parseSettings(JSON.stringify({ highScore: 9000 }), '4200');
    expect(parsed.highScore).toBe(9000);
  });
});
