# AgentDeal

An AI-native service marketplace. Buyers describe a job in plain words, AI turns it into a clear brief and ranks the three best-matching sellers with transparent scores. The buyer picks one, they chat privately (with file attachments), and payment is held until the buyer approves delivery.

## Features

- **Buyers:** natural-language requests, AI brief, top-3 matches with score breakdown (price fit, delivery speed, rating, skill match, offer quality), private deal chat, PayPal Sandbox checkout, confirm delivery, rate and review.
- **Sellers:** multiple listings, portfolio and profile links, listing stats (views, visitors, clicks, matches, deals), edit / pause / delete listings, earnings.
- **Admins:** transactions, sellers, manual payouts, support inbox.
- **Trust:** payment held until delivery is approved, real buyer reviews only, help & support tickets, cookie consent.

Demo sellers are clearly labelled and answered by an AI agent. Payments run in PayPal **Sandbox** (test money only). Seller payouts are tracked in the app and paid manually.

## Tech stack

- TanStack Start (React 19, file routes, server functions), Vite 7
- Tailwind CSS v4, shadcn/ui
- Lovable Cloud (Postgres, auth, storage) with row-level security
- Lovable AI Gateway (via the AI SDK)
- PayPal Checkout (Sandbox)

## Getting started

Requires [Bun](https://bun.sh) (or Node.js 20+).

```sh
bun install
cp .env.example .env   # fill in your values
bun run dev            # http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run test` | Run tests |
| `bun run lint` | Lint |

## Environment variables

See `.env.example`. `VITE_*` values are publishable and reach the browser. Everything else (service role key, AI key, PayPal secret) is server-only and must never be committed.

## Database

SQL migrations are in `supabase/migrations/` and `drizzle/migrations/`. Apply them in order (by filename, `supabase/` first) to a fresh Postgres/Supabase project to recreate the schema, policies, triggers and storage buckets.

## Project structure

```
src/
  routes/        pages and server routes (file-based)
  components/    UI components
  lib/           server functions (*.functions.ts), server-only helpers (*.server.ts), shared logic
  hooks/         React hooks
  integrations/  backend client setup (generated)
supabase/        backend config and SQL migrations
drizzle/         additional SQL migrations
public/          static files
```

## Deployment

The project is built for an edge (Cloudflare Workers-style) runtime and is published from Lovable with one click. Deploying elsewhere needs a host that supports TanStack Start server functions; set the same environment variables there.

## License

MIT — see [LICENSE](LICENSE).
