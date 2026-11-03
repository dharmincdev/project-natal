import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SMITH_FAMILY_TREE,
  SEED_AUDIO_DATA_URL,
  LEGACY_SILENT_WAV_DATA_URL,
  generateWarmHarmonicWavDataUrl,
} from '@/data/fixtures/smith-family';
import {
  getSupportedAudioMimeType,
  PREFERRED_AUDIO_MIME_TYPES,
} from '@/components/tree/AudioRecorder';
import { resolvePlayableAudioUrl } from '@/components/tree/PersonVaultSection';
import { QA_TEST_CASES } from '@/data/qa-test-cases';

describe('Audio Vault Reliability & Cleanup (PRO-19, PRO-20)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PRO-19: SMITH_FAMILY_TREE seed audio attachment has a valid multi-second audible WAV payload', () => {
    const robert = SMITH_FAMILY_TREE.people.find((p) => p.firstName === 'Robert');
    expect(robert).toBeDefined();

    const audioAttachment = robert?.attachments?.find((a) => a.id === 'att-rob-audio');
    expect(audioAttachment).toBeDefined();
    expect(audioAttachment?.type).toBe('audio');

    const url = audioAttachment!.url;
    expect(url.startsWith('data:audio/wav;base64,')).toBe(true);
    expect(url).not.toBe(LEGACY_SILENT_WAV_DATA_URL);

    const base64Payload = url.slice('data:audio/wav;base64,'.length);
    const buffer = Buffer.from(base64Payload, 'base64');
    expect(buffer.byteLength).toBeGreaterThan(44);

    // Verify RIFF / WAVE / fmt / data headers
    expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(buffer.toString('ascii', 8, 12)).toBe('WAVE');
    expect(buffer.toString('ascii', 12, 16)).toBe('fmt ');
    expect(buffer.toString('ascii', 36, 40)).toBe('data');

    const audioFormat = buffer.readUInt16LE(20);
    const numChannels = buffer.readUInt16LE(22);
    const sampleRate = buffer.readUInt32LE(24);
    const blockAlign = buffer.readUInt16LE(32);
    const bitsPerSample = buffer.readUInt16LE(34);
    const dataSize = buffer.readUInt32LE(40);

    expect(audioFormat).toBe(1); // PCM
    expect(numChannels).toBe(1); // Mono
    expect(sampleRate).toBeGreaterThanOrEqual(8000);
    expect(bitsPerSample).toBe(16);
    expect(blockAlign).toBe(2);

    const durationSeconds = dataSize / (sampleRate * blockAlign);
    expect(durationSeconds).toBeGreaterThanOrEqual(3);

    // Verify non-silent PCM samples
    const totalSamples = Math.floor(dataSize / 2);
    let maxAmplitude = 0;
    let nonZeroSamples = 0;
    for (let i = 0; i < totalSamples; i++) {
      const sample = Math.abs(buffer.readInt16LE(44 + i * 2));
      if (sample > 0) nonZeroSamples++;
      if (sample > maxAmplitude) maxAmplitude = sample;
    }

    expect(nonZeroSamples).toBeGreaterThan(totalSamples * 0.9);
    expect(maxAmplitude).toBeGreaterThan(10000);
  });

  it('PRO-19: resolvePlayableAudioUrl upgrades legacy 2ms silent WAV to audible SEED_AUDIO_DATA_URL', () => {
    expect(resolvePlayableAudioUrl(LEGACY_SILENT_WAV_DATA_URL)).toBe(SEED_AUDIO_DATA_URL);
    expect(resolvePlayableAudioUrl('')).toBe(SEED_AUDIO_DATA_URL);

    const customUrl = generateWarmHarmonicWavDataUrl(3.5, 8000);
    expect(resolvePlayableAudioUrl(customUrl)).toBe(customUrl);
  });

  it('PRO-19: getSupportedAudioMimeType negotiates Chrome/WebKit MediaRecorder MIME types in priority order', () => {
    const originalMediaRecorder = globalThis.MediaRecorder;
    try {
      globalThis.MediaRecorder = {
        isTypeSupported: (mime: string) => mime === 'audio/mp4',
      } as unknown as typeof MediaRecorder;

      expect(getSupportedAudioMimeType()).toBe('audio/mp4');

      globalThis.MediaRecorder = {
        isTypeSupported: (mime: string) => PREFERRED_AUDIO_MIME_TYPES.includes(mime as never),
      } as unknown as typeof MediaRecorder;

      expect(getSupportedAudioMimeType()).toBe('audio/webm;codecs=opus');
    } finally {
      globalThis.MediaRecorder = originalMediaRecorder;
    }
  });

  it('PRO-20: removes deprecated TC-3.2 Simulated Voice Memory test case from QA_TEST_CASES', () => {
    const tc32 = QA_TEST_CASES.find((tc) => tc.id === 'TC-3.2');
    expect(tc32).toBeUndefined();

    const simulatedTitle = QA_TEST_CASES.find((tc) =>
      /Simulated Voice/i.test(tc.title)
    );
    expect(simulatedTitle).toBeUndefined();

    expect(QA_TEST_CASES.find((tc) => tc.id === 'TC-3.1')).toBeDefined();
    expect(QA_TEST_CASES.find((tc) => tc.id === 'TC-3.3')).toBeDefined();
  });
});
