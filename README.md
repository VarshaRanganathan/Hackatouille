# ResilientBank

ResilientBank is a mobile-first financial resilience dashboard for Indian gig
workers and people with irregular income. It combines a React/Vite interface,
an Express API, and Supabase persistence.

This repository is intentionally portable. It can be opened by another AI
coding tool, a local IDE, or a Node.js hosting provider without relying on
Replit-specific APIs.

## Features

- Three-stage onboarding with a 20-question financial profile
- Signed, HTTP-only active-user session
- Home, Resilience, Save, Credit, and Guidance views
- Safe-to-save and emergency-savings tracking
- Buffer-day and resilience-score calculations
- Credit affordability guardrails
- What-If savings simulator
- Data-aware deterministic Guidance chat
- Full user-data reset

## Stack

- Node.js 20 or newer
- React 19 and Vite
- Express 5
- Tailwind CSS 4
- Supabase PostgreSQL and Auth

## Run locally or in another AI builder

1. Clone or import this GitHub repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

4. Fill in `SUPABASE_URL`, `SUPABASE_KEY`, and `SESSION_SECRET`.
5. Build and run the complete app:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000`.

The server honors the hosting provider's `PORT` environment variable.

### Development commands

```bash
npm run dev           # Full app using the current production build
npm run dev:frontend  # Vite frontend-only server with hot reload
npm run build         # Build React into dist/
npm run check         # Syntax-check backend files and build the frontend
npm test              # Alias for npm run check
```

The React app uses relative `/api/...` URLs. In a full-stack deployment, serve
the frontend and Express API from the same origin. `npm start` already does
this.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Server-side Supabase key used by the API |
| `SESSION_SECRET` | Yes | Signs the active-user cookie |
| `PORT` | No | HTTP port; defaults to `3000` |

Never place `SUPABASE_KEY` or `SESSION_SECRET` in `src/`, expose them through
Vite variables, or commit a populated `.env` file.

## Project map

```text
src/
  App.jsx              Complete React application and UI state
  index.css            Tailwind import and global interaction styles
  main.jsx             React entry point
server.js              Express routes, sessions, dashboard derivation
databaseHandlers.js    Validation and financial formulas
supabaseClient.js      Supabase server-client configuration
vite.config.mjs        Frontend build configuration
Architecture.md        High-level system diagram
Formulas.md            Product formula reference
AI_HANDOFF.md          Instructions for AI coding tools
```

## API summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/users/onboard` | Create the managed user and financial profile |
| `GET` | `/api/dashboard/active` | Load the signed-in user's dashboard |
| `POST` | `/api/savings/calculate` | Calculate a safe saving amount |
| `POST` | `/api/savings/commit` | Atomically move money into emergency savings |
| `POST` | `/api/guidance/chat` | Return data-aware financial guidance |
| `POST` | `/api/users/reset` | Remove the active user's managed data |

The browser is identified through a signed HTTP-only cookie. The API also
supports a matching Supabase bearer identity. Do not replace this with a
client-provided user ID.

## Moving to another platform

Most AI app builders can import this repository directly from GitHub. Give the
tool `AI_HANDOFF.md` as its first context file, configure the environment
variables above, and use:

```bash
npm install
npm start
```

Replit's `.replit` and `replit.md` files are optional metadata. Other platforms
can ignore them; the application does not import or depend on them.

## Safety notes

This is financial guidance software, not a banking ledger or lending approval
system. Preserve the validation, affordability circuit breaker, session checks,
idempotent savings behavior, and non-negative finite-number guards when making
changes.