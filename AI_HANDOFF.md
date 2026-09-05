# AI Coding Tool Handoff

Use this file as the first instruction when opening ResilientBank in another AI
coding environment.

## Objective

Maintain and extend a single-user, mobile-first financial resilience product
for Indian gig workers. Keep the existing product language calm, practical,
and non-judgmental.

## How to run

```bash
npm install
cp .env.example .env
npm start
```

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SESSION_SECRET`

Do not print, commit, or move these values into frontend code.

## Architecture

- `src/App.jsx`: onboarding, dashboard tabs, sheets, chatbot, and browser state
- `src/index.css`: Tailwind and global accessible interaction behavior
- `server.js`: Express API, signed cookie sessions, Supabase operations, and
  dashboard metric derivation
- `databaseHandlers.js`: input validation and all financial formulas
- `supabaseClient.js`: server-only Supabase clients

The frontend calls relative `/api` endpoints. Keep the frontend and backend on
the same origin unless you deliberately add a secure deployment architecture.

## Non-negotiable behavior

1. Never trust a user ID from the browser. Resolve the active user from the
   signed cookie or a verified Supabase bearer token.
2. Keep all financial outputs finite and non-negative.
3. Preserve server-side validation even when the UI validates the same input.
4. Savings transfers must remain idempotent and must not overdraw the available
   balance under concurrent requests.
5. A savings transfer reduces available balance and increases emergency
   savings by the same amount.
6. The Guidance response must use the authenticated user's current data.
7. Reset must remove the managed identity and all related financial data.
8. Keep interactive controls keyboard accessible and at least 44px tall on
   touch screens.
9. Keep `pb-32` clearance on tab content so the mobile bottom navigation does
   not cover actions.
10. Never silently replace Supabase or the existing session model.

## Financial formulas

The implementation in `databaseHandlers.js` is authoritative:

```text
Monthly essential expenses = rent + food + utilities + transport + debt
Daily burn rate = monthly essential expenses / 30
Buffer days = floor(current balance / max(1, daily burn rate))
Safe to save = max(0, round((today inflow - daily burn rate) * 0.8))
Expected 14-day income = expected daily income * 14
Credit ceiling = max(0, round((expected income - 14-day essentials) * 0.4))
Resilience score = clamp(round(buffer component + stability component), 0, 100)
```

Read the current functions before changing a formula. Update the UI explanation
sheet, API behavior, and `Formulas.md` together when formulas change.

## Supabase data model

The app expects these existing resources:

- Supabase Auth users
- `profiles`
- `transactions`
- `recurring_expenses`
- `resilience_scores`

Inspect `server.js` for the exact fields written and read. Do not invent a new
schema or migration unless explicitly requested. The balance transaction's
`RB_BALANCE:` description carries atomic transfer state and operation IDs; do
not rewrite or discard it casually.

## Change checklist

Before finishing a change:

```bash
npm run check
```

Then manually verify the affected lifecycle:

1. Onboard
2. Load dashboard
3. Calculate and commit savings
4. Check Guidance
5. Reset and confirm onboarding returns

Do not leave test users in Supabase.

## Suggested prompt for another AI tool

```text
Read README.md, AI_HANDOFF.md, databaseHandlers.js, and the relevant sections
of server.js/src/App.jsx before editing. Preserve the signed-session model,
Supabase schema, exact financial safeguards, idempotent savings transfers, and
mobile accessibility. Make the smallest coherent change, run npm run check,
and summarize changed files and verification.
```