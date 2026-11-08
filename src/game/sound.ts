// Procedural retro handheld sound effects using Web Audio API

export type SoundEventType =
  | 'start'
  | 'lane-change'
  | 'enemy-spawn'
  | 'turbo-on'
  | 'turbo-off'
  | 'pass-car'
  | 'level-up'
  | 'tick'
  | 'game-over';

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;
  public lastSound: SoundEventType | null = null;

  private recordEvent(event: SoundEventType) {
    this.lastSound = event;
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.lastSound = event;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'square',
    gainValue = 0.08,
    delaySec = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        now + durationSec
      );
    }

    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  public triggerHaptic(pattern: number | number[], label = 'tap') {
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.lastHaptic = label;
    }
    if (this.muted || typeof navigator === 'undefined') return;
    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore on unsupported platforms
    }
  }

  /**
   * Subtle low-frequency physical button thump to accompany haptic vibration on Left/Right buttons
   */
  public playTactileThump(direction: 'left' | 'right', blocked = false) {
    if (blocked) {
      this.triggerHaptic([12, 25, 12], `${direction}-boundary`);
      this.playTone(95, 0.045, 'triangle', 0.09, 0, 55);
      return;
    }
    this.triggerHaptic(18, direction);
    const startFreq = direction === 'left' ? 135 : 150;
    this.playTone(startFreq, 0.032, 'sine', 0.1, 0, 48);
  }

  public playStart() {
    this.recordEvent('start');
    this.triggerHaptic(20, 'start');
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.08, 'square', 0.07, i * 0.065);
    });
  }

  /**
   * 1. Player car movement (lane changes)
   */
  public playLaneChange(targetLane = 1) {
    this.recordEvent('lane-change');
    // Slightly pitch-shifted per lane (Left=392Hz, Center=440Hz, Right=493.88Hz)
    const laneFreqs = [392.0, 440.0, 493.88];
    const base = laneFreqs[targetLane] ?? 440.0;
    this.playTone(base, 0.055, 'square', 0.07, 0, base * 1.18);
  }

  /**
   * 2. Oncoming car spawns at the top of the grid
   */
  public playEnemySpawn(count = 1) {
    this.recordEvent('enemy-spawn');
    // Subtle retro radar blip when oncoming car wave enters top of grid
    this.playTone(622.25, 0.035, 'triangle', 0.045, 0, 523.25);
    if (count > 1) {
      this.playTone(739.99, 0.04, 'triangle', 0.045, 0.04, 587.33);
    }
  }

  /**
   * 3a. Turbo activation sound (rising dual-stage power sweep)
   */
  public playTurboActivate() {
    this.recordEvent('turbo-on');
    this.triggerHaptic([20, 30, 35], 'turbo-on');
    this.playTone(261.63, 0.09, 'sawtooth', 0.075, 0, 587.33);
    this.playTone(523.25, 0.11, 'square', 0.065, 0.05, 880.0);
  }

  /**
   * 3b. Turbo deactivation sound (falling turbine spin-down)
   */
  public playTurboDeactivate() {
    this.recordEvent('turbo-off');
    this.triggerHaptic(12, 'turbo-off');
    this.playTone(587.33, 0.09, 'triangle', 0.06, 0, 220.0);
  }

  public playTick(isTurbo: boolean, level: number) {
    const baseFreq = isTurbo ? 185 + level * 12 : 110 + level * 6;
    this.playTone(baseFreq, 0.02, 'triangle', isTurbo ? 0.035 : 0.02);
  }

  public playPassCar() {
    this.recordEvent('pass-car');
    this.playTone(740, 0.05, 'square', 0.05, 0);
    this.playTone(987.77, 0.07, 'square', 0.05, 0.045);
  }

  public playLevelUp() {
    this.recordEvent('level-up');
    this.triggerHaptic([18, 25, 30], 'level-up');
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, idx) => {
      this.playTone(f, 0.09, 'square', 0.07, idx * 0.06);
    });
  }

  /**
   * 4. Distinct sound for the 'Game Over' state (impact crunch + descending handheld jingle)
   */
  public playGameOver() {
    this.recordEvent('game-over');
    this.triggerHaptic([70, 40, 110], 'game-over');
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Initial low-frequency collision impact crunch
    this.playTone(160, 0.16, 'sawtooth', 0.11, 0, 55);
    this.playTone(115, 0.18, 'square', 0.09, 0.02, 42);

    // Classic descending 90s Brick Game 'Game Over' melody
    const melody = [
      { freq: 392.0, delay: 0.14, dur: 0.11 },
      { freq: 369.99, delay: 0.25, dur: 0.11 },
      { freq: 349.23, delay: 0.36, dur: 0.11 },
      { freq: 329.63, delay: 0.47, dur: 0.16 },
      { freq: 261.63, delay: 0.64, dur: 0.16 },
      { freq: 196.0, delay: 0.81, dur: 0.32 },
    ];
    melody.forEach((note) => {
      this.playTone(note.freq, note.dur, 'sawtooth', 0.085, note.delay);
    });
  }
}

export const soundEngine = new RetroSoundEngine();

