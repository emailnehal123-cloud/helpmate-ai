let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

const SOUND_PATTERNS: Record<string, number[]> = {
  'Starlight Chime': [587.33, 783.99, 1046.5, 1318.51],
  'Cosmic Bell': [523.25, 659.25, 987.77, 1174.66],
  'Morning Dew': [440, 554.37, 659.25, 880],
  'Gentle Sunrise': [392, 493.88, 587.33, 783.99],
};

export function playAlarmSoundPreview(soundName: string): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = SOUND_PATTERNS[soundName] ?? SOUND_PATTERNS['Starlight Chime'];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = soundName === 'Cosmic Bell' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.16);

    gain.gain.setValueAtTime(0.001, now + idx * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.16 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.16);
    osc.stop(now + idx * 0.16 + 0.6);
  });
}
