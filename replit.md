# ResilientBank API

## Run

The Replit workflow `ResilientBank API` runs `npm start`, which starts
`server.js` on port 3000. It can also be started locally with:

```bash
npm start
```

Set these environment secrets before using the Supabase-backed endpoints:

- `SUPABASE_URL` — the full Supabase project URL
- `SUPABASE_KEY` — the corresponding Supabase API key

## API endpoints

- `GET /api/users` — requires a Supabase bearer token for a profile whose
  `user_type` is `admin`
- `GET /api/dashboard/:userId` — requires a Supabase bearer token and only
  permits the authenticated user's own ID
- `POST /api/savings/calculate` with `{ "dailyIncome": 250, "dailyExpenses": 100 }`

For authenticated routes, send the user's Supabase access token:

```text
Authorization: Bearer <access-token>
```

Database requests use that token so Supabase Row Level Security policies are
applied to the authenticated user.