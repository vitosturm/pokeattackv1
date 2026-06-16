import { HeroStage } from '@/components/HeroStage';
import { LenisProvider } from '@/components/LenisProvider';
import { SectionTransition } from '@/components/SectionTransition';
import { HomePokedexPreview } from '@/components/HomePokedexPreview';
import { HomeTypeDemo } from '@/components/HomeTypeDemo';
import { HomeLeaderboardPreview } from '@/components/HomeLeaderboardPreview';

export const dynamic = 'force-dynamic'; // leaderboard preview reads from Neon

export default function HomePage() {
  return (
    <LenisProvider>
      <HeroStage />
      <SectionTransition>
        <HomePokedexPreview />
      </SectionTransition>
      <SectionTransition>
        <HomeTypeDemo />
      </SectionTransition>
      <SectionTransition>
        <HomeLeaderboardPreview />
      </SectionTransition>
    </LenisProvider>
  );
}
