# Tiered Holo Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade HoloCard to a full Simey-replica holographic system with 3 BST-based rarity tiers (Normal / Holo / Cosmos), stronger 3D tilt, sharper foil, and a passive galaxy animation on Cosmos cards.

**Architecture:** Rarity is derived automatically in `HoloCard.tsx` from `pokemon.stats` (BST sum), no new props. A CSS modifier class (`.holo-card--normal/holo/cosmos`) is added to the existing `.holo-card` element. All new visual effects live in `HoloCard.css` as additional modifier rules; the existing base rules are tightened (perspective, foil size, contrast). Three cosmos texture PNGs are downloaded from the Simey repo and placed in `public/img/`.

**Tech Stack:** React 19, Next.js 16 (App Router), Tailwind CSS v4, framer-motion 12, CSS custom properties driven by pointer events (no new JS libraries)

## Global Constraints

- TypeScript strict mode — no `any`, no `@ts-ignore`
- `npm run lint` must pass (0 errors; 1 pre-existing warning in layout.tsx is allowed)
- `npx vitest run` must show 34 passing tests (no new tests required — pure CSS/style change)
- `npm run build` must succeed
- No new npm dependencies
- All text stays English
- Dev server runs on port 3001 (`npm run dev`)
- Cosmos PNG assets from https://github.com/simeydotme/pokemon-cards-css (MIT licence) — download, do not copy-paste base64

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `public/img/cosmos-bottom.png` | CREATE (download) | Cosmos bottom texture layer |
| `public/img/cosmos-middle-trans.png` | CREATE (download) | Cosmos middle (transparent) texture |
| `public/img/cosmos-top-trans.png` | CREATE (download) | Cosmos top (transparent) texture |
| `components/HoloCard.tsx` | MODIFY | Add `getRarity()`, `--cosmosbg` seed, `--pointer-from-left/top` CSS vars, apply modifier class |
| `components/HoloCard.css` | MODIFY | Basis-fixes (perspective, tilt, foil sharpness, readability) + `.holo-card--holo` + `.holo-card--cosmos` modifier rules |

---

### Task 1: Download Cosmos Texture Assets

**Files:**
- Create: `public/img/cosmos-bottom.png`
- Create: `public/img/cosmos-middle-trans.png`
- Create: `public/img/cosmos-top-trans.png`

**Interfaces:**
- Produces: three PNG files at `/img/cosmos-bottom.png`, `/img/cosmos-middle-trans.png`, `/img/cosmos-top-trans.png` (referenced in Task 3 CSS as `url('/img/cosmos-bottom.png')` etc.)

- [ ] **Step 1: Create public/img directory and download the three textures**

```bash
mkdir -p public/img
curl -L "https://raw.githubusercontent.com/simeydotme/pokemon-cards-css/main/public/img/cosmos-bottom.png" -o public/img/cosmos-bottom.png
curl -L "https://raw.githubusercontent.com/simeydotme/pokemon-cards-css/main/public/img/cosmos-middle-trans.png" -o public/img/cosmos-middle-trans.png
curl -L "https://raw.githubusercontent.com/simeydotme/pokemon-cards-css/main/public/img/cosmos-top-trans.png" -o public/img/cosmos-top-trans.png
```

- [ ] **Step 2: Verify files downloaded correctly (non-zero size)**

```bash
ls -lh public/img/
```

Expected output (sizes approximate):
```
cosmos-bottom.png         ~200KB
cosmos-middle-trans.png   ~150KB
cosmos-top-trans.png      ~150KB
```

- [ ] **Step 3: Commit**

```bash
git add public/img/cosmos-bottom.png public/img/cosmos-middle-trans.png public/img/cosmos-top-trans.png
git commit -m "chore(assets): add cosmos texture PNGs from simeydotme/pokemon-cards-css (MIT)"
```

---

### Task 2: Add Rarity Logic and CSS Vars to HoloCard.tsx

**Files:**
- Modify: `components/HoloCard.tsx`

**Interfaces:**
- Consumes: `PokemonSummary['stats']` — already has `{ hp, attack, defense, specialAttack, specialDefense, speed }` (all six fields present per `lib/types.ts` StatsSchema)
- Produces:
  - `getRarity(stats: PokemonSummary['stats']): 'normal' | 'holo' | 'cosmos'` (used internally)
  - CSS class `.holo-card--normal` / `.holo-card--holo` / `.holo-card--cosmos` on the `.holo-card` div
  - New CSS vars set in `handleMove`: `--pointer-from-left`, `--pointer-from-top`
  - New CSS var set once on mount: `--cosmosbg` (random per-card seed)
  - `perspective` on `.holo-card-scene` tightened to 600px (was 1000px in CSS — done via inline style)

- [ ] **Step 1: Add `getRarity` helper and `useRef` for cosmos seed, open `components/HoloCard.tsx`**

After the `HOLO` map (around line 27), add:

```ts
type Rarity = 'normal' | 'holo' | 'cosmos';

function getRarity(stats: PokemonSummary['stats']): Rarity {
  const bst =
    stats.hp +
    stats.attack +
    stats.defense +
    stats.specialAttack +
    stats.specialDefense +
    stats.speed;
  return bst >= 480 ? 'cosmos' : bst >= 320 ? 'holo' : 'normal';
}
```

- [ ] **Step 2: Inside the `HoloCard` function body, derive rarity and cosmos seed**

After the existing `const primary = pokemon.types[0];` line, add:

```ts
const rarity = getRarity(pokemon.stats);
// Per-card random offset so cosmos galaxy textures are desynchronised across the grid.
// Stable for the card's lifetime via useRef (not state — no re-render needed).
const cosmosBgRef = useRef<string>(
  `${Math.floor(Math.random() * 734)}px ${Math.floor(Math.random() * 1280)}px`,
);
```

- [ ] **Step 3: Update `handleMove` to also set `--pointer-from-left` and `--pointer-from-top`**

In the `requestAnimationFrame` callback inside `handleMove`, after the existing `el.style.setProperty` calls, add:

```ts
el.style.setProperty('--pointer-from-left', `${px / 100}`);
el.style.setProperty('--pointer-from-top', `${py / 100}`);
```

(Note: `px` is already `0–100`, dividing by 100 gives `0–1` as Simey expects.)

- [ ] **Step 4: Update `handleLeave` to reset the new vars**

In `handleLeave`, after the existing resets, add:

```ts
el.style.setProperty('--pointer-from-left', '0.5');
el.style.setProperty('--pointer-from-top', '0.5');
```

- [ ] **Step 5: Apply modifier class and cosmos seed inline style to the `.holo-card` div**

Find the `<div ref={ref} className="holo-card" ...>` JSX (around line 127). Change it to:

```tsx
<div
  ref={ref}
  className={`holo-card holo-card--${rarity}`}
  style={{
    ...styleVars,
    ...(rarity === 'cosmos' ? { '--cosmosbg': cosmosBgRef.current } as React.CSSProperties : {}),
  }}
  onPointerMove={handleMove}
  onPointerLeave={handleLeave}
>
```

- [ ] **Step 6: Tighten perspective on the scene wrapper**

Find `<div className={`holo-card-scene ${className ?? ''}`}>` and add an inline style:

```tsx
<div
  className={`holo-card-scene ${className ?? ''}`}
  style={{ perspective: '600px' }}
>
```

- [ ] **Step 7: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add components/HoloCard.tsx
git commit -m "feat(cards): add BST rarity tiers + cosmos CSS vars to HoloCard"
```

---

### Task 3: Sharpen Basis Effects in HoloCard.css (all tiers)

**Files:**
- Modify: `components/HoloCard.css`

**Interfaces:**
- Consumes: nothing new — tightens existing rules
- Produces: sharper base foil for all cards; new CSS variables `--pointer-from-left`, `--pointer-from-top`, `--cosmosbg` documented (set by Task 2 JS)

- [ ] **Step 1: Tighten the resting `.holo-card` backdrop-filter and foil background-size**

Open `components/HoloCard.css`. In the `.holo-card` rule, `backdrop-filter` stays as-is. The main change is to the `background:` gradient — keep the gradient values unchanged but note the card background itself is fine. No change needed here; the foil sharpening is in `.holo-card__shine`.

- [ ] **Step 2: Update `.holo-card__shine` for sharper foil (tighter bands, higher contrast)**

Replace the entire `.holo-card__shine` rule with:

```css
.holo-card__shine {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  pointer-events: none;
  opacity: calc(var(--card-opacity) * 0.65);
  mix-blend-mode: color-dodge;
  background-blend-mode: color-dodge, screen;
  background-image:
    repeating-linear-gradient(
      82deg,
      var(--holo-1) 0%,
      var(--holo-2) 8%,
      var(--holo-3) 16%,
      var(--holo-1) 24%
    ),
    radial-gradient(
      farthest-corner circle at var(--pointer-x) var(--pointer-y),
      rgba(255, 255, 255, 0.7) 5%,
      rgba(120, 120, 120, 0.3) 40%,
      rgba(0, 0, 0, 0.6) 120%
    );
  background-position:
    calc(var(--background-x) * 1) calc(var(--background-y) * 1),
    center;
  background-size:
    160% 160%,
    200% 200%;
  filter: brightness(0.9) contrast(1.8) saturate(1.4);
}
```

Key changes vs. old:
- `opacity * 0.85` → `* 0.65` (less obscuring of sprite/name)
- `background-size`: `300% 300%` → `160% 160%` (tighter, sharper bands)
- Colour stop intervals: 12%/24%/36% → 8%/16%/24% (denser stripes)
- `contrast`: 1.4 → 1.8

- [ ] **Step 3: Add text-shadow to name for readability under foil**

In `components/HoloCard.tsx`, the name span is:
```tsx
const name = <span className="capitalize font-bold text-sm leading-tight">{pokemon.name}</span>;
```

Add an inline style for the text-shadow:
```tsx
const name = (
  <span
    className="capitalize font-bold text-sm leading-tight"
    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
  >
    {pokemon.name}
  </span>
);
```

Also add the same shadow to the HP span:
```tsx
<span
  className="text-[10px] font-bold text-white/80 whitespace-nowrap"
  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
>
  HP {pokemon.stats.hp}
</span>
```

- [ ] **Step 4: Verify lint and tests**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
```

Expected: 0 errors, 1 pre-existing warning, 34 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/HoloCard.css components/HoloCard.tsx
git commit -m "feat(cards): sharpen base foil — tighter bands, higher contrast, text-shadow for readability"
```

---

### Task 4: Holo Tier CSS (Regular Holo — Simey technique)

**Files:**
- Modify: `components/HoloCard.css`

**Interfaces:**
- Consumes: `.holo-card--holo` class (set by Task 2), `--background-x/y`, `--holo-1/2/3`
- Produces: `.holo-card--holo .holo-card__shine` overrides with sharp rainbow-stripe foil

- [ ] **Step 1: Add the Holo modifier rules at the bottom of HoloCard.css**

Append to `components/HoloCard.css`:

```css
/* ─── HOLO tier (BST 320–479) ─────────────────────────────────────────── */

.holo-card--holo .holo-card__shine {
  opacity: calc(var(--card-opacity) * 0.85);
  mix-blend-mode: color-dodge;
  background-image:
    repeating-linear-gradient(
      110deg,
      #c929f1,
      #0dbde9,
      #21e985,
      #eedf10,
      #f80e35,
      #c929f1,
      #0dbde9,
      #21e985,
      #eedf10,
      #f80e35,
      #c929f1,
      #0dbde9,
      #21e985,
      #eedf10,
      #f80e35
    ),
    repeating-linear-gradient(
      90deg,
      #000 0px,
      #000 2px,
      #666 2px,
      #666 4px
    );
  background-size: 400% 400%, cover;
  background-blend-mode: overlay;
  background-position:
    calc(((50% - var(--background-x)) * 2.6) + 50%)
    calc(((50% - var(--background-y)) * 3.5) + 50%),
    center center;
  filter: brightness(1.1) contrast(1.1) saturate(1.2);
}

.holo-card--holo .holo-card__shine::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      90deg,
      #000 0%,
      #000 6%,
      #b3b3b3 9%,
      #000 10.5%,
      #b3b3b3 12%,
      #000 15%,
      #000 42%
    );
  background-blend-mode: screen;
  mix-blend-mode: hard-light;
  filter: brightness(1.15) contrast(1.1);
  opacity: calc(var(--card-opacity) * 0.7);
}

.holo-card--holo .holo-card__shine::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    farthest-corner circle at var(--pointer-x) var(--pointer-y),
    rgba(230, 230, 230, 0.8) 0%,
    rgba(200, 200, 200, 0.1) 25%,
    #000 90%
  );
  mix-blend-mode: luminosity;
  filter: brightness(0.6) contrast(4);
  opacity: calc(var(--card-opacity) * 0.6);
}

.holo-card--holo .holo-card__glare {
  opacity: calc(var(--card-opacity) * 0.8);
  filter: brightness(0.8) contrast(1.5);
}
```

- [ ] **Step 2: Verify the styles compile (build check)**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` (or Next.js build success). No CSS parse errors.

- [ ] **Step 3: Quick visual check — start dev server, navigate to http://localhost:3001, hover a Holo-tier card (e.g. Pikachu, BST 320)**

```bash
# if not already running:
npm run dev
```

Look for: rainbow-coloured stripes that shift position as you move the mouse across Pikachu's card; scanline texture visible; strong colour contrast.

- [ ] **Step 4: Commit**

```bash
git add components/HoloCard.css
git commit -m "feat(cards): add holo-tier CSS (Simey regular-holo rainbow-stripe technique)"
```

---

### Task 5: Cosmos Tier CSS (Galaxy — 3-layer Simey technique)

**Files:**
- Modify: `components/HoloCard.css`

**Interfaces:**
- Consumes: `.holo-card--cosmos` class (Task 2), `--pointer-from-left`, `--pointer-from-top` (Task 2), `--cosmosbg` (Task 2), PNG assets from Task 1 at `/img/cosmos-bottom.png`, `/img/cosmos-middle-trans.png`, `/img/cosmos-top-trans.png`
- Produces: `.holo-card--cosmos` visual rules + `@keyframes cosmos-pulse` passive animation

- [ ] **Step 1: Append cosmos modifier rules to HoloCard.css**

```css
/* ─── COSMOS tier (BST ≥ 480) ─────────────────────────────────────────── */

/* Passive galaxy pulse — rotates the background-position of the rainbow
   gradient so the card shimmers even without hover. */
@keyframes cosmos-pulse {
  0%   { background-position: var(--cosmosbg, center), 10% 10%, center; }
  25%  { background-position: var(--cosmosbg, center), 90% 10%, center; }
  50%  { background-position: var(--cosmosbg, center), 90% 90%, center; }
  75%  { background-position: var(--cosmosbg, center), 10% 90%, center; }
  100% { background-position: var(--cosmosbg, center), 10% 10%, center; }
}

/* Resting state: stronger border glow so cosmos cards are immediately
   distinguishable in the grid without hovering. */
.holo-card--cosmos {
  border: 1px solid color-mix(in oklch, var(--holo-1), rgba(255, 255, 255, 0.4) 40%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.45),
    0 0 20px color-mix(in oklch, var(--holo-1), transparent 55%),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

/* Bottom layer — main cosmos texture + rainbow parallax + radial glare */
.holo-card--cosmos .holo-card__shine {
  opacity: 1;
  mix-blend-mode: color-dodge;
  animation: cosmos-pulse 10s linear infinite;
  background-image:
    url('/img/cosmos-bottom.png'),
    repeating-linear-gradient(
      82deg,
      hsl(53,  65%, 60%) calc(4% * 1),
      hsl(93,  56%, 50%) calc(4% * 2),
      hsl(176, 54%, 49%) calc(4% * 3),
      hsl(228, 59%, 55%) calc(4% * 4),
      hsl(283, 60%, 55%) calc(4% * 5),
      hsl(326, 59%, 51%) calc(4% * 6),
      hsl(326, 59%, 51%) calc(4% * 7),
      hsl(283, 60%, 55%) calc(4% * 8),
      hsl(228, 59%, 55%) calc(4% * 9),
      hsl(176, 54%, 49%) calc(4% * 10),
      hsl(93,  56%, 50%) calc(4% * 11),
      hsl(53,  65%, 60%) calc(4% * 12)
    ),
    radial-gradient(
      farthest-corner circle at var(--pointer-x) var(--pointer-y),
      hsla(180, 100%, 89%, 0.5) 5%,
      hsla(180, 14%, 57%, 0.3) 40%,
      hsl(0, 0%, 0%) 130%
    );
  background-blend-mode: color-burn, multiply;
  background-size: cover, 400% 900%, cover;
  background-position:
    var(--cosmosbg, center center),
    calc(10% + (var(--pointer-from-left, 0.5) * 80%))
    calc(10% + (var(--pointer-from-top, 0.5) * 80%)),
    center center;
  filter: brightness(1) contrast(1) saturate(0.8);
}

/* Middle layer */
.holo-card--cosmos .holo-card__shine::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    url('/img/cosmos-middle-trans.png'),
    repeating-linear-gradient(
      82deg,
      hsl(53,  65%, 60%) calc(4% * 1),
      hsl(93,  56%, 50%) calc(4% * 2),
      hsl(176, 54%, 49%) calc(4% * 3),
      hsl(228, 59%, 55%) calc(4% * 4),
      hsl(283, 60%, 55%) calc(4% * 5),
      hsl(326, 59%, 51%) calc(4% * 6),
      hsl(326, 59%, 51%) calc(4% * 7),
      hsl(283, 60%, 55%) calc(4% * 8),
      hsl(228, 59%, 55%) calc(4% * 9),
      hsl(176, 54%, 49%) calc(4% * 10),
      hsl(93,  56%, 50%) calc(4% * 11),
      hsl(53,  65%, 60%) calc(4% * 12)
    );
  background-blend-mode: lighten, multiply;
  background-size: cover, 400% 900%;
  background-position:
    var(--cosmosbg, center center),
    calc(15% + (var(--pointer-from-left, 0.5) * 70%))
    calc(15% + (var(--pointer-from-top, 0.5) * 70%));
  mix-blend-mode: overlay;
  filter: brightness(1.25) contrast(1.75) saturate(0.8);
  opacity: calc(var(--card-opacity) * 0.9 + 0.15);
}

/* Top layer */
.holo-card--cosmos .holo-card__shine::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    url('/img/cosmos-top-trans.png'),
    repeating-linear-gradient(
      82deg,
      hsl(53,  65%, 60%) calc(4% * 1),
      hsl(93,  56%, 50%) calc(4% * 2),
      hsl(176, 54%, 49%) calc(4% * 3),
      hsl(228, 59%, 55%) calc(4% * 4),
      hsl(283, 60%, 55%) calc(4% * 5),
      hsl(326, 59%, 51%) calc(4% * 6),
      hsl(326, 59%, 51%) calc(4% * 7),
      hsl(283, 60%, 55%) calc(4% * 8),
      hsl(228, 59%, 55%) calc(4% * 9),
      hsl(176, 54%, 49%) calc(4% * 10),
      hsl(93,  56%, 50%) calc(4% * 11),
      hsl(53,  65%, 60%) calc(4% * 12)
    );
  background-blend-mode: multiply, multiply;
  background-size: cover, 400% 900%;
  background-position:
    var(--cosmosbg, center center),
    calc(20% + (var(--pointer-from-left, 0.5) * 60%))
    calc(20% + (var(--pointer-from-top, 0.5) * 60%));
  mix-blend-mode: multiply;
  filter: brightness(1.25) contrast(1.75) saturate(0.8);
  opacity: calc(var(--card-opacity) * 0.85 + 0.1);
}

/* Cosmos glare — blue-tinted, stronger near edges */
.holo-card--cosmos .holo-card__glare {
  background-image: radial-gradient(
    farthest-corner circle at var(--pointer-x) var(--pointer-y),
    hsla(204, 100%, 95%, 0.8) 5%,
    hsla(250, 15%, 20%, 1) 150%
  );
  filter: brightness(0.75) contrast(2) saturate(2);
  mix-blend-mode: overlay;
  opacity: calc(var(--card-opacity) * (0.25 + var(--pointer-from-center, 0)));
}

/* Disable passive animation for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .holo-card--cosmos .holo-card__shine {
    animation: none;
  }
}
```

Note: the `:before`/`:after` rules on `.holo-card__shine` give an initial opacity > 0 (`+ 0.15` / `+ 0.1`) so the cosmos galaxy texture is faintly visible at rest, becoming fully vivid on hover.

- [ ] **Step 2: Verify lint and tests**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
```

Expected: 0 errors, 1 pre-existing warning, 34 tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/HoloCard.css
git commit -m "feat(cards): add cosmos-tier CSS (3-layer galaxy, parallax, passive pulse animation)"
```

---

### Task 6: Visual Verification + Final Commit

**Files:**
- No code changes — verification only, then push to main

**Interfaces:**
- Consumes: all changes from Tasks 1–5
- Produces: visual confirmation (Playwright screenshots), final push to main

- [ ] **Step 1: Run full verification suite**

```bash
npx tsc --noEmit && npm run lint && npx vitest run && npm run build
```

Expected: 0 tsc errors, 0 lint errors (1 warning ok), 34 vitest tests pass, build succeeds.

- [ ] **Step 2: Take Playwright screenshots to visually confirm 3 tiers**

Run this script (save as `/tmp/holo-verify.js` and execute with `node /tmp/holo-verify.js`):

```js
const { chromium } = require('/Users/jochenwahl/SE-6-Frontend/next-js/pokeattack/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 760));
  await page.waitForTimeout(600);
  // Carousel at rest — all 3 tiers visible
  await page.screenshot({ path: '/tmp/holo-all-rest.png', fullPage: false });
  // Hover over a Cosmos card (Charizard is index 4 in the featured list)
  const cards = page.locator('.holo-card-scene');
  await cards.nth(4).hover();
  await page.waitForTimeout(300);
  await cards.nth(4).screenshot({ path: '/tmp/holo-cosmos-hover.png' });
  // Hover over a Holo card (Pikachu is index 3)
  await cards.nth(3).hover();
  await page.waitForTimeout(300);
  await cards.nth(3).screenshot({ path: '/tmp/holo-holo-hover.png' });
  await browser.close();
  console.log('Screenshots saved to /tmp/holo-all-rest.png, /tmp/holo-cosmos-hover.png, /tmp/holo-holo-hover.png');
})();
```

- [ ] **Step 3: Confirm visually**

Check the screenshots:
- `/tmp/holo-all-rest.png` — Cosmos cards (Charizard, Gengar, Snorlax, Mewtwo etc.) have a border glow + faint galaxy shimmer at rest; Holo cards (Pikachu, Psyduck, Abra etc.) look moderately foiled; Normal cards (Bulbasaur, Charmander) are subtly type-tinted as before.
- `/tmp/holo-cosmos-hover.png` — Deep galaxy texture visible; parallax layers; blue-tinted glare; rainbow colour bands sweeping across as pointer moved.
- `/tmp/holo-holo-hover.png` — Sharp rainbow-stripe pattern shifting with pointer; scanline bars visible; specular highlight near pointer.

- [ ] **Step 4: Push to main (Vercel production deploy)**

```bash
git push origin main
```

Expected: push succeeds, Vercel deploy triggers automatically (visible in ~1–3 min).
