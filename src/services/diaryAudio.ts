/**
 * Realistic Web Audio API Synthesizer for Physical Diary Interactions
 * Generates natural, organic paper rustling and page turning sounds without external assets.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const SOUND_PREF_KEY = 'daily_diary_sound_enabled';

export const isDiarySoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(SOUND_PREF_KEY);
  return saved !== null ? saved === 'true' : true;
};

export const setDiarySoundEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_PREF_KEY, String(enabled));
};

/**
 * Realistic Page Turning Sound Synthesis
 * Simulates:
 * 1. Paper lift & scrape (bandpass filtered noise sweep)
 * 2. Paper flap / displacement resonance (low frequency air push)
 * 3. Soft page landing rustle
 */
export const playPageTurnSound = (direction: 'next' | 'prev' = 'next'): void => {
  if (!isDiarySoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.32;

    // --- 1. Noise Buffer for Paper Scrape/Rustle ---
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Pinkish/brown noise curve for softer texture than harsh white noise
      const white = Math.random() * 2 - 1;
      output[i] = (white * (1 - (i / bufferSize) * 0.4));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filter to shape the frequency of paper scrape
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.8, now);

    if (direction === 'next') {
      // Ascending then settling frequency sweep
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    } else {
      // Descending sweep for turning backward
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.14);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);
    }

    // Highpass filter to eliminate harsh muddy sub-rumble
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(350, now);

    // Noise Gain Envelope (Lift -> Swish -> Land)
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.16);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // --- 2. Low Frequency Paper Flap Body ---
    const flapOsc = ctx.createOscillator();
    const flapGain = ctx.createGain();

    flapOsc.type = 'triangle';
    flapOsc.frequency.setValueAtTime(direction === 'next' ? 140 : 160, now);
    flapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    flapGain.gain.setValueAtTime(0.001, now);
    flapGain.gain.linearRampToValueAtTime(0.10, now + 0.05);
    flapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    flapOsc.connect(flapGain);
    flapGain.connect(ctx.destination);

    // Start synthesis
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    flapOsc.start(now);
    flapOsc.stop(now + 0.25);
  } catch {
    // Graceful fallback if Web Audio is blocked or unavailable
  }
};

/**
 * Bookmark Action Sound
 * Metallic chime + tactile page clip sound
 */
export const playBookmarkSound = (isBookmarking: boolean): void => {
  if (!isDiarySoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell/ribbon snap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (isBookmarking) {
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
    } else {
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
};
