// Looping ambient wallpapers for the "video" homepage design, transcoded to
// 1080p/muted from the originals in pokemonbackgrounds/ (see public/videos/backgrounds/).
// Prefixed with the app's basePath (next.config.ts) since Next does not
// rewrite raw <video src> strings the way it does next/link or next/image.
export const BACKGROUND_VIDEOS = [
  '/pokeattack/videos/backgrounds/bulbasaur-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/charizard-breathing-fire-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/greninja-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/lucario-power-surge-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/mewtwo-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/pikachu-at-the-train-station-on-a-rainy-day-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/pikachu-in-the-rain-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/pikachu-sitting-in-field-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/pokeball-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/pokemon-gengar-1-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/pokemon-leafeaon-and-espeon-forest-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/powerful-mewtwo-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/snorlax-flower-bed-napping-pokemon-moewalls-com.mp4',
  '/pokeattack/videos/backgrounds/squirtle-pokemon-moewalls-com.mp4',
] as const;
