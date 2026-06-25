const STORAGE_KEY = 'pokeattack:battle-muted';

let muted: boolean | undefined;
const subscribers = new Set<() => void>();

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

export function isMuted(): boolean {
  if (muted === undefined) {
    muted = readInitial();
  }
  return muted;
}

export function setMuted(value: boolean): void {
  if (isMuted() === value) return;
  muted = value;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }
  for (const cb of subscribers) cb();
}

export function toggleMuted(): void {
  setMuted(!isMuted());
}

export function subscribeMuted(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
