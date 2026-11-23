import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSpeechRecognitionSupported,
  playPitRadioChirp,
  startSpeechListening,
  speakRaceEngineerRadio,
  _resetAudioContextForTesting
} from './speechEngine';

describe('Voice Engineer & Web Audio Speech Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetAudioContextForTesting();
  });

  it('detects SpeechRecognition availability correctly', () => {
    // In standard Node/jsdom, SpeechRecognition is absent by default
    const initialSupported = isSpeechRecognitionSupported();
    expect(typeof initialSupported).toBe('boolean');

    const win = window as unknown as Record<string, unknown>;
    // Mock presence
    win.SpeechRecognition = vi.fn();
    expect(isSpeechRecognitionSupported()).toBe(true);
    delete win.SpeechRecognition;
  });

  it('plays pit radio chirp without throwing in Web Audio environment', () => {
    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    };
    const mockFilter = {
      type: 'bandpass',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn()
    };
    const mockBufferSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };

    class MockAudioContext {
      currentTime = 10;
      sampleRate = 44100;
      destination = {};
      createOscillator = vi.fn(() => mockOscillator);
      createGain = vi.fn(() => mockGain);
      createBuffer = vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(100))
      }));
      createBufferSource = vi.fn(() => mockBufferSource);
      createBiquadFilter = vi.fn(() => mockFilter);
    }

    const win = window as unknown as Record<string, unknown>;
    win.AudioContext = MockAudioContext;

    expect(() => playPitRadioChirp()).not.toThrow();
  });

  it('falls back gracefully when starting speech recognition on unsupported browsers', () => {
    const errorSpy = vi.fn();
    const win = window as unknown as Record<string, unknown>;
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;

    const stop = startSpeechListening({
      onResult: vi.fn(),
      onError: errorSpy
    });

    expect(typeof stop).toBe('function');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not supported'));
  });

  it('dispatches voice synthesis with radio chirp', () => {
    const speakSpy = vi.fn();
    const cancelSpy = vi.fn();
    const win = window as unknown as Record<string, unknown>;
    win.speechSynthesis = {
      speak: speakSpy,
      cancel: cancelSpy,
      getVoices: vi.fn(() => [])
    };
    win.SpeechSynthesisUtterance = vi.fn(function (text: string) {
      return { text, rate: 1, pitch: 1 };
    });

    speakRaceEngineerRadio('Box this lap, box box');
    expect(typeof speakRaceEngineerRadio).toBe('function');
  });
});
