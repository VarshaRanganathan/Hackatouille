# ResilientBank API

The app is standard React/Vite + Express + Supabase and is portable outside
Replit. See `README.md` for platform-neutral setup and `AI_HANDOFF.md` for
instructions intended for other AI coding tools.

## Run

The Replit workflow `ResilientBank API` runs `npm start`, which builds the
React frontend and starts `server.js` on port 3000. It can also be started
locally with:

```bash
npm start
```

For frontend-only development, use `npm run dev` and open the Vite port shown
by the terminal.

Set these environment secrets before using the Supabase-backed endpoints:

- `SUPABASE_URL` — the full Supabase project URL
- `SUPABASE_KEY` — the corresponding Supabase API key

## API endpoints

- `POST /api/users/onboard` — saves the onboarding answers, recurring
  expenses, synthetic income history, and initial resilience metrics
- `GET /api/dashboard/active` — returns the active onboarded user's dashboard
- `POST /api/savings/calculate` with `{ "today_inflow": 1200 }`
- `POST /api/users/reset` — clears the active user's onboarding data

The active user is scoped by a signed, HTTP-only session cookie. Supabase
bearer tokens are also supported when the app has an authenticated user.