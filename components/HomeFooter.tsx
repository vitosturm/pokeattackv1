'use client';

import Link from 'next/link';

const STACK = [
  'Next.js 16',
  'React 19',
  'TypeScript',
  'Tailwind v4',
  'shadcn/ui',
  'Prisma',
  'Neon Postgres',
  'PokeAPI',
  'Framer Motion',
  'Lenis',
  'tsParticles',
  'canvas-confetti',
  'use-sound',
  'Vitest',
  'Playwright',
];

export function HomeFooter() {
  return (
    <footer className="relative bg-[#0a0a0f] border-t border-white/10 mt-10">
      <div className="max-w-6xl mx-auto py-20 px-6 grid gap-10 md:grid-cols-3">
        <div>
          <p
            className="text-[10px] uppercase text-white/50 mb-3"
            style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
          >
            Built with
          </p>
          <div className="flex flex-wrap gap-2">
            {STACK.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p
            className="text-[10px] uppercase text-white/50 mb-3"
            style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
          >
            Project
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <a
                href="https://github.com/vitosturm/pokeattackv1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                GitHub repo →
              </a>
            </li>
            <li>
              <a
                href="https://pokeapi.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Data from PokeAPI
              </a>
            </li>
            <li>
              <Link href="/pokedex" className="hover:text-white">
                Browse the Pokédex
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:text-right">
          <p
            className="text-[10px] uppercase text-white/50 mb-3"
            style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
          >
            Ready?
          </p>
          <Link
            href="/battle"
            className="inline-block bg-gradient-to-r from-[#ff3860] to-[#ff5a30] text-white px-8 py-4 rounded-full text-lg hover:opacity-90"
            style={{
              fontFamily: 'Bangers, Impact, sans-serif',
              letterSpacing: '0.06em',
              boxShadow: '0 10px 30px rgba(255,56,96,0.4)',
            }}
          >
            Play now →
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        Pokémon and Pokémon character names are trademarks of Nintendo. Not affiliated.
      </div>
    </footer>
  );
}
