# FairSplit

**Free, open-source expense sharing for friends, roommates, and travel groups.**

FairSplit is a modern [Splitwise](https://www.splitwise.com)-style app for tracking shared costs, splitting bills fairly, and settling up — without paywalls or premium-only features. Built with Next.js, TypeScript, and PostgreSQL.

**Live demo:** [fairsplit.thecrudstudio.com](https://fairsplit.thecrudstudio.com)

---

## Features

- **Groups & expenses** — Create groups, add expenses, and split evenly, by shares, by percentage, or by custom amounts
- **Dashboard** — See what you owe and what you're owed across all groups at a glance
- **Debt simplification** — Reduce the number of payments needed to settle everyone up
- **Settlement explanations** — Plain-language breakdowns of who paid for what and why you owe someone
- **Settle up** — Record payments between members and track balances over time
- **Friends** — Add friends by email or shareable invite link
- **Group invites** — Share a link so others can join a group without hunting for usernames
- **Recurring expenses** — Daily, weekly, or monthly expense templates
- **Multi-currency** — Per-group currency support
- **Receipt uploads** — Attach images or PDFs to expenses (local dev; see [Receipt storage](#receipt-storage))
- **Email verification** — OTP codes via [Resend](https://resend.com)
- **Dark mode** — System-aware light/dark theme
- **Mobile-first UI** — Responsive layout with a center FAB for quick actions

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI | Radix UI primitives |
| Data | [Prisma](https://www.prisma.io) + PostgreSQL |
| Client state | TanStack Query |
| Auth | JWT session cookies (`jose`) + bcrypt |
| Email | Resend |
| Tests | Vitest |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm
- Docker (optional, for local Postgres)

### 1. Clone and install

```bash
git clone https://github.com/mxkumr/FairSplit.git
cd FairSplit
npm install
```

### 2. Environment variables

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooler URL in production) |
| `DIRECT_URL` | Direct PostgreSQL URL (migrations; port 5432 on Supabase) |
| `JWT_SECRET` | Secret for signing session tokens (min 32 chars in production) |
| `RESEND_API_KEY` | Resend API key for email OTP |
| `EMAIL_FROM` | Sender address, e.g. `FairSplit <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Public app URL for invite links (e.g. `http://localhost:3000`) |

### 3. Database

**Option A — Docker (recommended for local dev)**

```bash
npm run db:up
npm run db:migrate
npm run db:seed   # optional demo users
```

**Option B — Existing Postgres**

Set `DATABASE_URL` and `DIRECT_URL`, then:

```bash
npm run db:migrate
```

Demo seed accounts (password: `password123`):

- `alice@example.com`
- `bob@example.com`

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |
| `npm run db:up` | Start Postgres via Docker Compose |
| `npm run db:down` | Stop Postgres container |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:push` | Push schema without migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

---

## Deployment

FairSplit is designed to deploy on [Vercel](https://vercel.com) with a hosted PostgreSQL database (e.g. [Supabase](https://supabase.com)).

1. Create a Supabase project and copy the **transaction pooler** (`6543`) and **session pooler** (`5432`) URLs into `DATABASE_URL` and `DIRECT_URL`.
2. Set `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` in Vercel environment variables.
3. Verify your sending domain in Resend before production email delivery.
4. Run migrations against `DIRECT_URL` before or during first deploy:

   ```bash
   npx prisma migrate deploy
   ```

### Receipt storage

Receipts are currently saved to `public/uploads/expenses/` on the server filesystem. This works for local development but **does not persist reliably on Vercel** (ephemeral filesystem). For production file uploads, use object storage such as Supabase Storage, S3, or Vercel Blob.

---

## Project structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # React UI components
  hooks/            # TanStack Query hooks
  lib/              # Auth, balances, debt simplification, API client
prisma/
  schema.prisma     # Database schema
  migrations/       # SQL migrations
docs/legal/         # Privacy policy & terms references
```

---

## Contributing

Contributions are welcome! Feel free to open an issue or pull request on GitHub.

1. Fork the repository
2. Create a feature branch
3. Make your changes and add tests where it makes sense
4. Open a PR with a clear description

Questions? Reach out via [GitHub Issues](https://github.com/mxkumr/FairSplit/issues) or email [mxkumr@gmail.com](mailto:mxkumr@gmail.com).

---

## Legal

- [Privacy Policy](https://fairsplit.thecrudstudio.com/privacy)
- [Terms of Service](https://fairsplit.thecrudstudio.com/terms)

FairSplit is not affiliated with or endorsed by Splitwise.

---

## License

[MIT](LICENSE) © [Manish Kumar](https://github.com/mxkumr)

---

## Author

**Manish Kumar**

- GitHub: [@mxkumr](https://github.com/mxkumr)
- LinkedIn: [Manish Kumar B](https://www.linkedin.com/in/manish-kumar-b-175a701b0/)
- Project: [github.com/mxkumr/FairSplit](https://github.com/mxkumr/FairSplit)
