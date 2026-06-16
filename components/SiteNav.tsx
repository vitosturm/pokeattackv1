import Link from 'next/link';

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0f]/70 border-b border-white/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-white text-lg"
          style={{
            fontFamily: 'Bungee, Inter, sans-serif',
            letterSpacing: '0.12em',
            textShadow: '2px 2px 0 #ff3860',
          }}
        >
          POKEATTACK
        </Link>
        <div
          className="flex items-center gap-6 text-[10px] uppercase text-white/75"
          style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
        >
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/pokedex" className="hover:text-white">
            Pokedex
          </Link>
          <Link href="/roster" className="hover:text-white">
            My Pokemons
          </Link>
          <Link href="/battle" className="hover:text-white">
            Battle
          </Link>
          <Link href="/leaderboard" className="hover:text-white">
            Leaderboard
          </Link>
          <Link
            href="/battle"
            className="text-white px-4 py-2 rounded-full hover:opacity-90"
            style={{
              background: '#ff3860',
              boxShadow: '0 6px 18px rgba(255,56,96,0.5), inset 0 -3px 0 rgba(0,0,0,0.25)',
              fontSize: '9px',
            }}
          >
            Play now
          </Link>
        </div>
      </div>
    </nav>
  );
}
