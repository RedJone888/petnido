# PetCare — scaffold


## Setup


1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `pnpm install` or `npm install`.
3. Generate Prisma client: `npx prisma generate`.
4. Run migrations / dev DB: `npx prisma migrate dev --name init`.
5. Seed: `npm run seed`.
6. Run dev server: `npm run dev`.


## Architecture
- Next.js (App Router) + TypeScript
- tRPC for backend APIs
- Prisma + PostgreSQL
- Stripe for payments (webhooks)
- Tailwind CSS for styles


## Next steps (suggestions)
- Implement authentication (NextAuth or Clerk)
- Build post creation UI and listing + map
- Implement booking flow with Stripe payment
- Add tests and CI/CD