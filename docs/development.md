# Local development and testing

Use the Node.js version in `.nvmrc` (currently 24.19.0) and npm 10 or newer. Run the commands below from the repository root. With nvm installed, `nvm install` followed by `nvm use` selects the project's version.

## Normal development with PostgreSQL

Install the locked dependencies and create a local environment file:

```sh
npm ci --ignore-scripts
cp .env.example .env
```

Use a dedicated local PostgreSQL database. The example `DATABASE_URL` expects a `petnido` role and database at `localhost:5432`; create them yourself or change the URL to match your local setup. Migration commands currently use `DATABASE_URL`, not `DIRECT_URL`.

Replace `AUTH_SECRET`, `AUTH_RATE_LIMIT_SECRET`, `PENDING_ACTION_SECRET`, and `INTERNAL_JOB_TOKEN` with separate random values. Generate each value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep `APP_URL`, `NEXT_PUBLIC_APP_URL`, and `AUTH_URL` aligned with the development server origin, normally `http://localhost:3000`.

Keep `FEATURE_PROFILE_E2E` and `FEATURE_VERTICAL_SLICE` set to `false`, and leave `VALIDATION_DATABASE_URL` and `VALIDATION_TEST_TOKEN` empty. Ordinary development uses PostgreSQL and the real authentication flow. Do not copy validation settings into a deployed environment.

Generate both Prisma clients, apply existing migrations to your local database, and start Next.js:

```sh
npm run prisma:generate
npm run prisma:validation:generate
npm run prisma:migrate:deploy
npm run dev
```

The validation client is generated because validation routes are included in the source tree; generating it does not select SQLite for the application or create a test session. Use `prisma:migrate:deploy` when setting up an existing checkout; `prisma:migrate` is for authoring schema migrations.

Email registration and verification require working SMTP settings, such as a local mail-capture server. Google and LINE sign-in require their own OAuth credentials and the callback URLs shown in `.env.example`. Real uploads require Cloudinary credentials, and map tiles require `NEXT_PUBLIC_MAPTILER_KEY`. Leaving these integrations unconfigured does not provide a substitute login, upload, or map service. `FEATURE_EMAIL_OUTBOX=false` disables queued notification delivery; it does not replace the SMTP configuration needed for authentication emails.

## Automated checks

After dependency installation and client generation, run the repository's quality checks:

```sh
npm run quality
```

This runs lint, TypeScript, unit and integration tests, translation-key checks, location-privacy source checks, and Prisma schema validation. Integration tests create and clean up a separate SQLite database at `prisma/validation/validation.integration.db`; they do not need a running PostgreSQL server. The validation schema and adapters are useful regression coverage, but do not replace testing PostgreSQL migrations and real authentication in a dedicated development or staging environment.

For browser tests:

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts its own server at `http://127.0.0.1:3107`, uses `.next-e2e`, and sets the validation flags, token, and SQLite URL in the server environment. It prepares and cleans up `prisma/validation/validation.e2e.db`. Do not run multiple E2E sessions against this same checkout at once. The ordinary `.env` should keep validation disabled; you do not need to change it to run these tests.

`TEST_DATABASE_URL` is separate from the SQLite validation URL. The explicit PostgreSQL reset script uses it and passes it to migrations and seeding as `DATABASE_URL`; running the seed script directly instead reads `DATABASE_URL`. Neither is used by `npm run test:integration` or the Playwright fixture setup. These reset/seed scripts require their own opt-in and are not part of normal development setup.

## Validation mode and troubleshooting

Application tRPC requests and public-detail metadata use SQLite only when `NODE_ENV` is not `production`, `FEATURE_PROFILE_E2E=true`, and both `VALIDATION_DATABASE_URL` and `VALIDATION_TEST_TOKEN` are nonempty. Anonymous requests stay in that test database too, so public pages and authenticated fixtures see the same data. A fixture session additionally requires the matching validation token. `FEATURE_VERTICAL_SLICE` controls the standalone architecture-validation page and API; it does not select the main application's database.

If you intentionally run the fixture environment manually, use the setup in `playwright.config.ts` and `tests/e2e/global-setup.ts` as the source of truth, including schema preparation, constraints, and fixture seeding. Setting a SQLite URL alone does not prepare that database.

If normal local development unexpectedly shows fixture data or loses a real login, check the shell environment and all Next.js `.env*` files, especially `.env.local`, for old validation overrides. Disable `FEATURE_PROFILE_E2E`, clear the validation URL and token, and restart the server. After updating a checkout, rerun both Prisma generation commands if a generated client is missing or out of date.
