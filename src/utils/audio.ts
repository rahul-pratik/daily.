/**
 * Audio synthesis and waveform generation utilities for voice messages.
 */

/**
 * Creates a synthetic playable audio WAV data URL or blob URL.
 * Generates a warm, gentle voice-like melodic frequency cadence.
 */
export const createSyntheticAudioDataUrl = (durationSec: number = 4): string => {
  try {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Synthesize harmonic formant tones mimicking vocal inflections
      const f1 = 280 + Math.sin(t * 5) * 45;
      const f2 = 560 + Math.sin(t * 3.5) * 60;
      const envelope = Math.min(1, Math.min(t * 5, (durationSec - t) * 5));
      const sample = (Math.sin(2 * Math.PI * f1 * t) * 0.2 + Math.sin(2 * Math.PI * f2 * t) * 0.1) * envelope;
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x7fff : sample * 0x7fff, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch {
    return '';
  }
};

/**
 * Deterministically generates an array of waveform bar heights (percentage 18 - 98)
 * for a voice message based on its URL, duration, or ID.
 */
export const generateWaveformBars = (
  seed: string = 'voice',
  barCount: number = 28
): number[] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Generate pseudo-random value between 0 and 1
    const pseudoRandom = Math.abs(Math.sin((hash + i * 17.382) * 93.284));
    // Apply speech envelope: speech typically starts soft, has central energy, with pauses
    const envelope = Math.sin((i / (barCount - 1)) * Math.PI);
    const minHeight = 22;
    const maxHeight = 96;
    const height = Math.floor(minHeight + pseudoRandom * (maxHeight - minHeight) * (0.65 + envelope * 0.35));
    bars.push(Math.max(18, Math.min(98, height)));
  }

  return bars;
};
