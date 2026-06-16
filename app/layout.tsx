import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AnimatedBackdrop } from '@/components/AnimatedBackdrop';
import './globals.css';

export const metadata: Metadata = {
  title: 'PokeAttack',
  description: '3-vs-3 Pokémon battles with a global leaderboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bangers&family=Bungee&family=Press+Start+2P&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] text-[#e8e8ee] antialiased">
        <AnimatedBackdrop />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
