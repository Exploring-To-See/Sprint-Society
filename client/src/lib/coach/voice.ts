/**
 * Voice output for the AI coach.
 *
 * Uses the Web Speech Synthesis API — supported by every modern browser, the
 * Android System WebView, and iOS WKWebView that Capacitor apps run in — so the
 * same code speaks on web, APK, and iOS. Degrades gracefully to silent no-ops
 * when speech synthesis is unavailable.
 *
 * Each persona has a signature delivery (rate/pitch).
 */

import type { Persona } from './api';

interface VoiceStyle {
  rate: number;
  pitch: number;
  /** Preferred voice-name fragments, best first. */
  prefer: string[];
}

const PERSONA_VOICE: Record<Persona, VoiceStyle> = {
  scientist: { rate: 1.0, pitch: 0.95, prefer: ['Google UK English Male', 'Daniel', 'Male'] },
  energizer: { rate: 1.12, pitch: 1.15, prefer: ['Google UK English Female', 'Samantha', 'Female'] },
  warrior: { rate: 1.05, pitch: 0.8, prefer: ['Google US English', 'Alex', 'Male'] },
  sage: { rate: 0.92, pitch: 0.9, prefer: ['Google UK English Female', 'Karen', 'Female'] },
};

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (!isVoiceSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  return cachedVoices;
}

// Voices load asynchronously on some platforms (notably Android WebView).
if (isVoiceSupported()) {
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
  if (!isVoiceSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const style = PERSONA_VOICE[persona];
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
  if (!isVoiceSupported()) return;
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
}
