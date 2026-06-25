'use client';

import { isMuted } from '@/lib/muteState';

let sharedCtx: AudioContext | null | undefined;

function getAudioContext(): AudioContext | null {
  if (sharedCtx !== undefined) return sharedCtx;
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    sharedCtx = null;
    return null;
  }
  try {
    sharedCtx = new Ctor();
  } catch {
    sharedCtx = null;
  }
  return sharedCtx;
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
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 440, 880, 150, 'square');
}

export function playFaintSound(): void {
  if (isMuted()) return;
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
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const freq = STATUS_FREQ[status];
  playTone(ctx, freq, freq, 90, 'triangle');
  setTimeout(() => playTone(ctx, freq, freq, 90, 'triangle'), 120);
}
