# Quiz Battle Arena

Live trivia for 2–8 players. Create a room, share its six-character code, and play on separate devices. No accounts or installation.

## Deploy on Render

1. Push this folder's contents to the **root** of your GitHub repository.
2. Open Render → **New → Blueprint** and connect `gautamreb/quiz-battle-arena`.
3. Choose the branch containing `render.yaml`. Render detects a Node web service and a PostgreSQL database.
4. Review the plans and deploy. The default Blueprint requests free plans. It creates no paid service automatically.
5. Wait for the web service to become **Live**, then open the `https://…onrender.com` URL shown in Render.
6. Create a room and join from a second phone or browser. The host starts once two players are connected.

A backend is essential: deploy as a **Web Service**, not a Static Site. The Blueprint supplies `DATABASE_URL` using the database's private connection string. Schema setup runs automatically before the server starts. The server binds to Render's `PORT` on `0.0.0.0`. `/api/health` verifies database readiness.

Render free web services sleep after inactivity and can have cold starts. Free PostgreSQL expires after 30 days. For ongoing availability, review paid service/database plans in Render or use another PostgreSQL provider. See https://render.com/docs/free. No purchase is required by this source package.

For an existing manually created Render web service, set build command `npm ci --include=dev && npm run build`, start command `npm start`, health path `/api/health`, Node version `22.22.0`, and a secret `DATABASE_URL`. Keep the database in the same region. For a custom domain, set `APP_ORIGIN` to its full HTTPS origin; otherwise Render's automatic `RENDER_EXTERNAL_URL` is used for request-origin checks.

## Local development

Requires Node 22.13+ and PostgreSQL. Copy `.env.example` to `.env.local`, set `DATABASE_URL`, then:

```sh
npm ci
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```

For production locally, set `DATABASE_URL` in your shell, run `npm run build`, then `npm start`. Default port: 3000.

## Tests

```sh
npm test
npm run build
node tests/integration.mjs http://localhost:3000
```

Engine tests cover scoring boundaries, ties, late/duplicate answers, host transfer, reconnecting, ten rounds, and rematch. Storage tests run the real PostgreSQL queries against an embedded PostgreSQL engine and exercise concurrent joins and answers. The integration script tests eight independent clients against a running app and database.

## Rules and architecture

10 questions, 15 seconds each, four answer choices, one locked answer. Correct answers earn 100 points plus `floor(50 × remaining_ms / 15000)`. A four-second reveal follows each round. Equal scores share rank. Hosts start and restart; after a 30-second absence, control transfers to a connected player. Inactive rooms expire after two hours. New games select questions not used in the preceding game.

Next.js serves the responsive interface and anonymous API. PostgreSQL stores shared room state. Conditional revision updates and retries prevent concurrent players from overwriting answers or scores. The server owns deadlines and scoring. Clients poll every 500 ms and use the server clock for countdowns. Correct choices stay server-side until reveal. Device tokens are stored in browser session storage and never sent to other players.

Source: `app/page.tsx`, `app/api/game/route.ts`, `lib/game/engine.ts`, `lib/game/store.ts`, `lib/game/questions.ts`. The bundled bank contains 40 reviewed questions.
