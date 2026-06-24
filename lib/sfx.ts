'use client';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  type: OscillatorType,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + durationMs / 1000);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playCritSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 440, 880, 150, 'square');
}

export function playFaintSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 600, 150, 400, 'sawtooth');
}

const STATUS_FREQ: Record<'paralysis' | 'burn' | 'poison', number> = {
  paralysis: 900,
  burn: 300,
  poison: 500,
};

export function playStatusSound(status: 'paralysis' | 'burn' | 'poison'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const freq = STATUS_FREQ[status];
  playTone(ctx, freq, freq, 90, 'triangle');
  setTimeout(() => {
    const ctx2 = getAudioContext();
    if (ctx2) playTone(ctx2, freq, freq, 90, 'triangle');
  }, 120);
}
