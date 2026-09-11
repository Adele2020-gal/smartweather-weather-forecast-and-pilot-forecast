// Web Audio synthesizer for meteorological emergency alerts
export function playWeatherAlertChime(severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' = 'WARNING') {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    if (severity === 'CRITICAL') {
      // Two-tone emergency alert tone (850Hz / 440Hz pulse)
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(850, now);
      osc1.frequency.setValueAtTime(440, now + 0.15);
      osc1.frequency.setValueAtTime(850, now + 0.3);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
    } else {
      // Smooth dual chime for advisory / notification
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (err) {
    console.warn('Audio alert could not play:', err);
  }
}
