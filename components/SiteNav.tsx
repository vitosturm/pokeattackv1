import Link from 'next/link';
import './SiteNav.css';

export function SiteNav() {
  return (
    <div className="site-nav-wrapper">
      <div className="nav-bar">
        <Link href="/" className="logo">
          POKEATTACK
        </Link>
        <div className="nav-items">
          <Link href="/">Home</Link>
          <Link href="/pokedex">Pokedex</Link>
          <Link href="/roster">My Pokemons</Link>
          <Link href="/battle">Battle</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/battle" className="cta-nav">
            Play now
          </Link>
        </div>
      </div>
    </div>
  );
}
