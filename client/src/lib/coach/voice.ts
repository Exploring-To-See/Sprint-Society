/**
 * Voice output for the AI coach.
 *
 * Native (APK / iOS): the Android System WebView does NOT implement the Web
 * Speech API, so voice goes through the device text-to-speech engine via
 * @capacitor-community/text-to-speech — the same engine Google Maps uses for
 * turn-by-turn audio, including audio-focus ducking over music.
 *
 * Web: Web Speech Synthesis API. Degrades to a silent no-op when neither is
 * available — voice is an enhancement and must never break the run tracker.
 *
 * Each persona has a signature delivery (rate/pitch).
 */

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNative } from '../native';
import type { Persona } from './api';

interface VoiceStyle {
  rate: number;
  pitch: number;
  /** Preferred voice-name fragments, best first (web voices only). */
  prefer: string[];
}

const PERSONA_VOICE: Record<Persona, VoiceStyle> = {
  scientist: { rate: 1.0, pitch: 0.95, prefer: ['Google UK English Male', 'Daniel', 'Male'] },
  energizer: { rate: 1.12, pitch: 1.15, prefer: ['Google UK English Female', 'Samantha', 'Female'] },
  warrior: { rate: 1.05, pitch: 0.8, prefer: ['Google US English', 'Alex', 'Male'] },
  sage: { rate: 0.92, pitch: 0.9, prefer: ['Google UK English Female', 'Karen', 'Female'] },
};

export function isVoiceSupported(): boolean {
  if (isNative) return true; // native TTS engine
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function webSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!webSpeechAvailable()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  return cachedVoices;
}

// Voices load asynchronously on some platforms.
if (!isNative && webSpeechAvailable()) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

function pickVoice(persona: Persona): SpeechSynthesisVoice | null {
  const voices = loadVoices().filter(v => v.lang.startsWith('en'));
  if (voices.length === 0) return null;
  const { prefer } = PERSONA_VOICE[persona];
  for (const fragment of prefer) {
    const match = voices.find(v => v.name.toLowerCase().includes(fragment.toLowerCase()));
    if (match) return match;
  }
  return voices[0];
}

/**
 * Speak a coaching line in the persona's voice. Cancels anything currently
 * being spoken first — during a run the newest cue always wins.
 */
export function speak(text: string, persona: Persona = 'energizer'): void {
  if (!text) return;
  const style = PERSONA_VOICE[persona];

  if (isNative) {
    // stop() before speak so the newest cue always wins; queueStrategy 0 also
    // flushes, but stopping explicitly matches the web behavior exactly.
    TextToSpeech.stop().catch(() => {})
      .then(() => TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: style.rate,
        pitch: style.pitch,
        volume: 1.0,
        category: 'playback',
        queueStrategy: 0,
      }))
      .catch(() => { /* engine missing/busy — stay silent */ });
    return;
  }

  if (!webSpeechAvailable()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = style.rate;
    utterance.pitch = style.pitch;
    utterance.volume = 1;
    const voice = pickVoice(persona);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Voice is an enhancement; never let it break the run tracker.
  }
}

export function stopSpeaking(): void {
  if (isNative) {
    TextToSpeech.stop().catch(() => {});
    return;
  }
  if (!webSpeechAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch { /* ignore */ }
}
