/**
 * F1 Archive — Voice Engineer & Pit-Radio Audio Synthesis Engine
 * Features:
 * 1. Native Web Audio API two-tone pit-radio chirp & radio static squelch (0 audio files)
 * 2. Feature-detected Web Speech API SpeechRecognition facade
 * 3. SpeechSynthesis text-to-speech for race engineer radio transmissions
 */

let sharedAudioContext: AudioContext | null = null;

export function _resetAudioContextForTesting(): void {
  sharedAudioContext = null;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

/**
 * Generates an authentic Formula 1 team radio tone sequence:
 * Tone 1 (880 Hz) -> Tone 2 (1760 Hz) + Radio Static Squelch Burst
 */
export function playPitRadioChirp(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: 880 Hz (40 ms)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // Tone 2: 1760 Hz (50 ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now + 0.045);
    gain2.gain.setValueAtTime(0.12, now + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.045);
    osc2.stop(now + 0.095);

    // Radio Static Squelch: White Noise burst (60 ms)
    const bufferSize = ctx.sampleRate * 0.06;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now + 0.09);
    filter.Q.setValueAtTime(3.0, now + 0.09);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, now + 0.09);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now + 0.09);
    whiteNoise.stop(now + 0.15);
  } catch (err) {
    console.warn('[speechEngine] Web Audio playback failed:', err);
  }
}

/**
 * Cross-browser Speech Recognition Facade with feature detection
 */
interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: { [index: number]: SpeechRecognitionResultItem };
}

interface SpeechRecognitionEvent {
  results?: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error?: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as SpeechRecognitionWindow;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export interface SpeechListenerOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function startSpeechListening(options: SpeechListenerOptions): () => void {
  const { onResult, onError, onEnd } = options;
  if (!isSpeechRecognitionSupported()) {
    onError?.('Speech recognition is not supported in this browser.');
    return () => {};
  }

  const win = window as SpeechRecognitionWindow;
  const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!SpeechConstructor) {
    onError?.('Speech recognition constructor not found.');
    return () => {};
  }

  try {
    const recognition = new SpeechConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(event.error || 'Speech recognition fault');
    };

    recognition.onend = () => {
      onEnd?.();
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop on inactive instance
      }
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start speech recognition';
    onError?.(message);
    return () => {};
  }
}

/**
 * Text-to-Speech Race Engineer radio transmission
 */
export function speakRaceEngineerRadio(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Play pit radio beep first
  playPitRadioChirp();

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.lang = 'en-GB'; // British race engineer accent preference

      // Find suitable voice if available
      const voices = window.speechSynthesis.getVoices();
      const engineerVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Oliver')));
      if (engineerVoice) {
        utterance.voice = engineerVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[speechEngine] Speech synthesis failed:', err);
    }
  }, 160);
}
