/**
 * useLuxSound — Zero-cost Web Audio API sound design
 * No files. No imports. Pure synthesis.
 *
 * Sounds:
 * - select()   : Soft metallic ting (image selected in forge grid)
 * - complete() : Gentle ascending two-tone chime (generation done)
 * - hover()    : Nearly-silent breath click (nav hover, very subtle)
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(
  freq: number,
  type: OscillatorType,
  gainPeak: number,
  attackMs: number,
  decayMs: number,
  delayMs = 0
) {
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.connect(env);
    env.connect(ac.destination);

    osc.type = type;
    osc.frequency.value = freq;

    const now   = ac.currentTime + delayMs / 1000;
    const peak  = now + attackMs / 1000;
    const end   = peak + decayMs / 1000;

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainPeak, peak);
    env.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.start(now);
    osc.stop(end);
  } catch (_) {
    // Audio blocked — silently pass
  }
}

export const luxSound = {
  /** Soft metallic ting — image tile selected */
  select() {
    playTone(1480, 'sine',     0.06, 2,   600);
    playTone(2960, 'sine',     0.02, 2,   400);
  },

  /** Warm ascending chime — generation complete */
  complete() {
    playTone(523,  'sine',     0.07, 10,  800,    0);   // C5
    playTone(659,  'sine',     0.05, 10,  800,  220);   // E5
    playTone(784,  'sine',     0.04, 10, 1200,  440);   // G5
  },

  /** Near-silent click — hover on interactive elements */
  hover() {
    playTone(3200, 'sine',     0.015, 1,  80);
  },
};
