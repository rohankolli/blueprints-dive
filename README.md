# Surplus — Daily Shipment

A **Blueprints for Pangaea**–themed rare-answer daily game (Krillion-*like* mechanics, original brand and content).

**Product name:** Surplus  
**Daily mode:** Daily Shipment  
**Org spelling:** Pangaea

Seven shared prompts each day. Rarer correct answers ship farther (Loading dock → One in a Pangaea). One attempt per calendar day; reset at midnight **America/New_York**.

> All prompts/answers in this MVP are **`status: placeholder`** until Rohan supplies real content.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- File/JSON-backed placeholder dailies (no Postgres required for MVP)
- Server `/api/score` so the full answer bank is not shipped to the client
- Guest progress in `localStorage`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |

## How to play

1. Open the home page — brand **Surplus**, then start **Daily Shipment**.
2. Read each of 7 prompts (short countdown), then answer within ~25 seconds.
3. Unrecognized answers can be retried until time runs out (time cost only).
4. After prompt 7, see km shipped, band, breakdown, copyable share text, and an optional study sheet.
5. Coming-soon stubs: Endless Inventory, Past Manifests, Chapter Board, packs, Pass the Manifest.

To replay on the same calendar day while testing, clear site data / `localStorage` key `surplus.guest.v1`.

## Project layout

```text
content/placeholder-prompts.ts   # server-only answer banks (placeholders)
src/app/api/daily|score|complete # daily meta + scoring + results unlock
src/components/DailyPlay.tsx     # timed play loop + results
src/lib/normalize.ts             # answer normalization + light fuzzy match
src/lib/tiers.ts                 # B4P logistics tiers / day bands
```

## Path to Postgres (later)

MVP keeps prompts in `content/`. A clean follow-up:

1. Tables for `Prompt`, `Answer`, `Alias`, `DailySet`, `PlayAttempt` (see Project `build-plan.md`).
2. Point `/api/daily` and `/api/score` at Neon/Vercel Postgres.
3. Keep the same response shapes so the client barely changes.

## Open questions for Rohan

- Final product name / domain (Surplus is a working pick from the brand shortlist).
- Confirm reset TZ (currently America/New_York).
- Timeline for real prompt + answer banks.
- Whether results should include donate / join-chapter CTAs as primary.
- Logo lockup permission vs sibling game mark.

## Non-goals (v1)

No Krillion art/copy/assets, no ads, no multiplayer, no paid unlocks.
