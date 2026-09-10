/**
 * Audio synthesis and waveform generation utilities for voice messages.
 */

/**
 * Encodes an ArrayBuffer into a base64 string safely without call-stack limits.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32768
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

/**
 * Creates a synthetic playable audio WAV base64 data URL.
 * Generates a warm, human speech-like harmonic formant cadence.
 * Returns a permanent, self-contained data URL that persists in storage.
 */
export const createSyntheticAudioDataUrl = (durationSec: number = 4): string => {
  try {
    const safeDuration = Math.max(1, Math.min(60, durationSec));
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * safeDuration);
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
      // Synthesize vocal formants mimicking speech cadence with intonation
      const pitch = 220 + Math.sin(t * 3.8) * 35 + Math.sin(t * 8.5) * 15;
      const formant1 = pitch * 2;
      const formant2 = pitch * 3;
      // Speech envelope with pauses mimicking words
      const cadence = 0.5 + 0.5 * Math.sin(t * 4.2);
      const attackDecay = Math.min(1, Math.min(t * 8, (safeDuration - t) * 8));
      const envelope = cadence * attackDecay;

      const sample =
        (Math.sin(2 * Math.PI * pitch * t) * 0.45 +
          Math.sin(2 * Math.PI * formant1 * t) * 0.25 +
          Math.sin(2 * Math.PI * formant2 * t) * 0.15) *
        envelope;

      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }

    const base64 = bufferToBase64(buffer);
    return `data:audio/wav;base64,${base64}`;
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
