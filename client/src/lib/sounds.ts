let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playSound(type: 'xp' | 'levelup' | 'achievement') {
  const enabled = localStorage.getItem('sprint-sounds') !== 'off';
  if (!enabled) return;

  switch (type) {
    case 'xp':
      playTone(880, 0.12, 'sine', 0.1);
      break;
    case 'levelup':
      playTone(523, 0.15, 'sine', 0.12);
      setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
      setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 200);
      break;
    case 'achievement':
      playTone(659, 0.12, 'triangle', 0.12);
      setTimeout(() => playTone(880, 0.25, 'triangle', 0.15), 120);
      break;
  }
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem('sprint-sounds', enabled ? 'on' : 'off');
}

export function isSoundEnabled(): boolean {
  return localStorage.getItem('sprint-sounds') !== 'off';
}
