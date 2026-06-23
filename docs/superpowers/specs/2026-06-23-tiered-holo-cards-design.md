# Spec: Tiered Holo Cards (Simey Full Replica)

Date: 2026-06-23

## Goal

Upgrade `HoloCard` to a full Simey-style (https://github.com/simeydotme/pokemon-cards-css) holographic card system with:
- 3 BST-based rarity tiers: Normal / Holo / Cosmos
- Type-keyed accent colours (existing `--holo-1/2/3`)
- Stronger 3D tilt + sharper foil base fix (all tiers)
- Passive glow animation on Cosmos cards
- Cosmos galaxy PNG textures from the Simey repo (MIT licence)

## Rarity Tiers

```
BST = hp + attack + defense + specialAttack + specialDefense + speed
Normal  : BST < 320  → .holo-card--normal   (subtle type-foil)
Holo    : 320–479    → .holo-card--holo     (sharp rainbow-stripe foil)
Cosmos  : ≥ 480      → .holo-card--cosmos   (3-layer galaxy + parallax + passive glow)
```

Helper (in HoloCard.tsx):
```ts
function getRarity(stats): 'normal' | 'holo' | 'cosmos' {
  const bst = stats.hp + stats.attack + stats.defense +
              stats.specialAttack + stats.specialDefense + stats.speed;
  return bst >= 480 ? 'cosmos' : bst >= 320 ? 'holo' : 'normal';
}
```

## Files Changed

| File | Change |
|---|---|
| `components/HoloCard.tsx` | getRarity(), --cosmosbg seed, --pointer-from-left/top, modifier class |
| `components/HoloCard.css` | Basis-fixes + 3 tier modifier classes |
| `public/img/cosmos-bottom.png` | NEW — downloaded from simeydotme repo (MIT) |
| `public/img/cosmos-middle-trans.png` | NEW |
| `public/img/cosmos-top-trans.png` | NEW |

No prop changes — rarity is derived automatically from existing `pokemon.stats`.

## Basis-Fixes (all tiers)

1. `perspective`: 1000px → 600px (tilt feels stronger at same angle)
2. Rotate divisor: `/3.5` → `/2.8` (slightly more tilt range)
3. Foil `background-size`: 300% → 160% (tighter, sharper bands)
4. Foil `contrast`: 1.4 → 1.8 (crisper colour separation)
5. Add `--pointer-from-left` + `--pointer-from-top` to `handleMove` (needed for Cosmos parallax)
6. Name text-shadow: `0 1px 4px rgba(0,0,0,0.8)` (readable under foil)
7. Shine opacity cap: 0.85 → 0.65 (don't obscure sprite)

## CSS Modifier: `.holo-card--normal`

No structural change from current baseline — inherits the sharpened basis-fixes only.

## CSS Modifier: `.holo-card--holo`

Simey "regular-holo" technique:
- `.holo-card__shine` background: `repeating-linear-gradient(110deg, violet → blue → green → yellow → red × 3)` + scanline overlay
- `background-size`: 400% 400%
- `background-position`: driven by `--background-x/y`
- `filter`: brightness(1.1) contrast(1.1) saturate(1.2)
- `mix-blend-mode`: color-dodge
- `:before` bar pattern (screen blend)
- `:after` specular radial spot (luminosity)

## CSS Modifier: `.holo-card--cosmos`

Simey "cosmos-holo" technique — 3 layers via base + :before + :after:

**Bottom layer** (`.holo-card__shine`):
- `background-image`: cosmos-bottom.png + 12-stop rainbow repeating-linear-gradient + radial glare
- `background-blend-mode`: color-burn, multiply
- `background-position`: `--cosmosbg` (random per-card seed) + parallax at 80% weight
- `filter`: brightness(1) contrast(1) saturate(.8)
- `mix-blend-mode`: color-dodge

**Middle layer** (`:before`):
- cosmos-middle-trans.png + same rainbow
- `background-blend-mode`: lighten, multiply
- parallax at 70% weight
- `filter`: brightness(1.25) contrast(1.75) saturate(.8)
- `mix-blend-mode`: overlay

**Top layer** (`:after`):
- cosmos-top-trans.png + same rainbow
- `background-blend-mode`: multiply, multiply
- parallax at 60% weight
- `mix-blend-mode`: multiply

**Passive glow animation** (non-hover, `.holo-card--cosmos` only):
- CSS `@keyframes cosmos-pulse` rotates `background-position` of the rainbow gradient slowly
- 10s infinite linear, no JS needed
- Disabled by `@media (prefers-reduced-motion: reduce)`
- Resting state also has border: `1px solid color-mix(in oklch, var(--holo-1), transparent 20%)` (stronger than Normal/Holo)

## Verification

1. `npx tsc --noEmit` — 0 errors
2. `npm run lint` — 0 errors (1 pre-existing warning in layout.tsx allowed)
3. `npx vitest run` — 34 tests pass
4. `npm run build` — clean
5. Playwright screenshots (port 3001):
   - Confirm 3 tiers visually distinct in carousel + Pokédex grid
   - Bulbasaur (BST 318) → Normal; Charizard (BST 534) → Cosmos
   - Cosmos cards show galaxy textures on hover; passive glow visible at rest
   - Name/HP readable during hover (not washed out by foil)
   - `@media (prefers-reduced-motion)` disables animations
