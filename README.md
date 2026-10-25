# SafeExit

A responsive travel safety website resembling the requested reference at https://kaushiki-d-nayak.github.io/safe_exit/. The supplied public HTML, CSS and planning interactions were adapted, and the missing live safety feature was implemented with a persistent backend.

## Features

- Trip overview and private, database-backed trip creation and deletion, with destination, travel dates, accommodation, notes and trusted contact.
- Message warning checks using local text rules. Messages are not uploaded; this is guidance, not a sender authentication or link-scanning service.
- Custom Plan B cards for transport problems, closures, late check-ins and unfamiliar locations, with selectable text to copy.
- Discreet help phrases, next steps and personalised meeting-point details.
- Consent-based live location sharing with expiring private contact links, link replacement, check-in deadlines, SOS, acknowledgements, resolved alerts and optional browser notifications.
- Optional OpenStreetMap view and emergency telephone links.
- Full source download in the website header and footer.

## Technologies

Static HTML, CSS and browser JavaScript; TypeScript Netlify Functions; Netlify Database (Postgres); Drizzle ORM and generated SQL migrations. No frontend build step is needed.

## Run locally

1. Install Node.js 22 or newer and the Netlify CLI.
2. Run `npm install`.
3. Connect this folder to your Netlify project using `netlify link`. For another project, create/link that project instead.
4. Run `npm run dev` and open http://localhost:8889. The CLI supplies the local function runtime and database integration. Opening the HTML as a local file does not run the API.

The deployment publishes `public/`, bundles `netlify/functions/` and applies migrations from `netlify/database/migrations/`. Database credentials are supplied by the platform; no credentials are included in the source.

After editing the schema, create a migration with `npm run db:generate -- --name describe_your_change`. Deployment applies migrations; do not manually apply schema changes against the managed database.

## Privacy and operational details

Trips belong to an anonymous browser workspace, identified by an HttpOnly, SameSite cookie. They persist in Postgres. Clearing cookies or changing browsers loses access; there is no account system or cross-device trip sync.

A safety link grants its holder access to the latest precise location and alert acknowledgement. Tokens use cryptographic randomness and only their hashes are stored. The link token is in the URL fragment to keep it out of normal URL access logs. Only the latest point is stored, not a route history. Revoking/replacing links is immediate. Ending sharing deletes the session, location and alerts. Expired sessions are inaccessible and are removed during API requests or hourly cleanup on published deployments.

Location requires HTTPS (or localhost), permission and an active page. Browser/phone backgrounding can pause updates. Location writes are limited to once every ten seconds; dashboards refresh every five seconds. Missed check-ins are materialised when a dashboard polls after the deadline. SOS and missed check-ins are dashboard alerts, not SMS, email, push while closed, or emergency dispatch. Notifications require browser support and permission and work while the contact dashboard is open. In immediate danger in India, call 112.

Message checks, Plan B output and help phrases are processed in the browser and are not persisted. Trips are saved on the server; sensitive passwords, payment credentials or passport numbers should not be entered.

## Source archive

Download `/safeexit-codebase.zip` from the running site. Regenerate it after changes with `npm run source` (Python 3 required). It includes the frontend, server functions, schema, migrations, lockfile, documentation and packaging script, excluding dependencies, local Netlify state, credentials and the ZIP itself.

## Verification

Source files, API integration and generated migrations were reviewed. Local build, test and server commands were not run in the creation environment; the deployment pipeline performs build validation. Browser location, permissions and notifications need a real browser on the deployed HTTPS site.
