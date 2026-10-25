# SafeExit architecture

The project is a static website with serverless API functions, intentionally preserving the visual design of the reference. There is no frontend framework or bundling step. Netlify publishes `public/` directly.

## Key directories

- `public/index.html`: all six application panels, navigation, forms and metadata.
- `public/styles.css`, `safety.css`, `trips.css`: original green-and-cream responsive design and component styles.
- `public/app.js`: navigation, local message checks, contingency plans and discreet help cards.
- `public/trips.js`: persistent trip API client and DOM rendering.
- `public/safety.js`: owner/contact dashboard, polling, geolocation, consent, private links and alert interactions.
- `netlify/functions/api.mts`: `/api/*` routes for trip and safety operations.
- `netlify/functions/cleanup.mts`: hourly removal of expired sessions on published deployments.
- `db/schema.ts`: source of truth for Postgres tables; `db/index.ts` creates the Drizzle client.
- `netlify/database/migrations/`: generated migrations applied by the platform.
- `scripts/package-source.py`: creates the downloadable full source archive.

## Conventions

Use DOM APIs and `textContent` for user input, not `innerHTML`. Preserve accessible form labels, loading/empty/error states, keyboard focus and responsive styling. All persisted data belongs in Netlify Database. Use Drizzle beta packages because its Netlify adapter requires them. Schema changes require generated migrations; never manually apply migrations.

Database calls happen inside function invocations. APIs return no-store responses. Anonymous workspace ownership comes from a cryptographically random HttpOnly browser cookie; only its hash is used in database records. There is no user-account authentication. Mutations verify same-origin requests. Never expose owner identifiers or stored link hashes in API responses. Private contact tokens are in URL fragments and sent in an explicit header. Store only token hashes server-side. Contacts cannot mutate owner settings and can only acknowledge alerts. A session has at most one latest location. Session deletion cascades to alerts.

Keep emergency and notification claims accurate: alerts are seen through an open, polling dashboard. There are no SMS/email integrations or background mobile tracking. Read-only checks must not be described as sender verification. Pending/expired/disconnected UI must never imply that an old location proves safety.

Use `npm run dev` for local development on port 8889. The managed creation environment delegates validation to the deployment pipeline; do not run builds, tests or development servers there. Read edited files to review changes. Run `npm run source` after source changes so the ZIP matches the current code. The archive must never contain dependencies, environment files, local platform metadata or credentials.
