# PokeAttack

A Next.js 16 Pokémon battle game built for a bootcamp project.
3-vs-3 type-based battles, PokeAPI sprites & moves, Neon Postgres leaderboard.

## Quickstart

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL
npx prisma migrate dev
npm run dev
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` / `npm start` — production
- `npm test` — Vitest unit + component tests
- `npm run e2e` — Playwright happy-path test
- `npm run lint` / `npm run format` — ESLint / Prettier

## Manual verification checklist

1. `npm run dev` → homepage loads, balls bounce, click → /battle.
2. Add 3 Pokémon to roster → reload → roster persists.
3. Complete a battle → score on /leaderboard.
4. Disconnect network mid-battle → toast appears, score saved locally.
