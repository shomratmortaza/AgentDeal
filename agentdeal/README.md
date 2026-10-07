# AgentDeal

An AI-native service marketplace. Buyers describe a job in plain words, AI turns it into a clear brief and ranks the three best-matching sellers with transparent scores. The buyer picks one, they chat privately (with file attachments), and payment is processed through PayPal Sandbox while the deal and seller payout status are tracked in AgentDeal.

## Features

* **Buyers:** natural-language requests, AI brief, top-3 matches with score breakdown (price fit, delivery speed, rating, skill match, offer quality), private deal chat, file attachments, PayPal Sandbox checkout, confirm delivery, rate and review.
* **Sellers:** multiple listings, portfolio and profile links, listing stats (views, visitors, clicks, matches, deals), edit / pause / delete listings, earnings.
* **Admins:** transactions, sellers, manual payouts, support inbox.
* **Trust:** transparent transaction tracking, real buyer reviews, help & support tickets, cookie consent.

Demo sellers are clearly labelled as **Demo Sellers** and are answered by an AI agent. Payments run in **PayPal Sandbox** using test money only. Seller payout amounts and status are tracked in the app and paid manually.

## Tech Stack

* TanStack Start (React 19, file routes, server functions), Vite 7
* Tailwind CSS v4, shadcn/ui
* Lovable Cloud (Postgres, auth, storage) with row-level security
* Lovable AI Gateway (via the AI SDK)
* PayPal Checkout (Sandbox)

## Getting Started

Requires [Bun](https://bun.sh) (or Node.js 20+).

```sh
bun install
cp .env.example .env
# Fill in your environment variables
bun run dev
# http://localhost:8080
```

| Command         | What it does         |
| --------------- | -------------------- |
| `bun run dev`   | Start the dev server |
| `bun run build` | Production build     |
| `bun run test`  | Run tests            |
| `bun run lint`  | Lint                 |

## Environment Variables

See `.env.example`.

`VITE_*` values are publishable and may reach the browser. Everything else, including service role keys, AI keys, and PayPal secrets, is server-only and must never be committed.

## Database

SQL migrations are included in:

* `supabase/migrations/`
* `drizzle/migrations/`

Apply migrations in order by filename when recreating the database schema, policies, triggers, and storage configuration.

## Project Structure

```text
src/
├── routes/          Pages and server routes (file-based)
├── components/      UI components
├── lib/             Server functions, server-only helpers, and shared logic
├── hooks/           React hooks
└── integrations/    Backend client setup

supabase/            Backend configuration and SQL migrations
drizzle/             Additional SQL migrations
public/              Static assets
```

## AI

AgentDeal uses AI to:

* Understand natural-language buyer requests
* Generate structured job briefs
* Match buyers with relevant sellers
* Rank and explain seller recommendations
* Evaluate offers using transparent scoring
* Support AI-assisted negotiation
* Generate responses from demo seller agents

The AI layer is powered through the Lovable AI Gateway and AI SDK.

## PayPal

AgentDeal integrates **PayPal Checkout in Sandbox mode**.

The payment flow includes:

1. Creating a PayPal order
2. Buyer approval
3. Capturing the payment
4. Recording the transaction in AgentDeal
5. Tracking the deal and seller payout status

PayPal Sandbox uses test money and is used for the hackathon demonstration.

AgentDeal does **not** claim to provide PayPal escrow. Seller payout amounts and status are tracked within the application and handled manually.

## Matching & Scoring

AgentDeal evaluates seller offers using a transparent scoring model:

* **Price Fit:** 35%
* **Delivery Speed:** 30%
* **Seller Rating:** 20%
* **Skill Match:** 10%
* **Offer Quality:** 5%

The buyer can see why a seller was recommended instead of receiving an unexplained AI ranking.

## AI-to-AI Negotiation

AgentDeal can support negotiation between the buyer-side AI agent and demo seller agents.

For example:

* Seller Agent: $120
* Buyer Agent: $100 budget
* Buyer Agent proposes $100 with one revision
* Seller Agent responds with a counteroffer
* Buyer Agent evaluates the counteroffer
* The final offer is presented to the buyer

The buyer remains in control of the final purchase decision.

## Deployment

The project is designed for an edge-compatible runtime supporting TanStack Start server functions.

When deploying elsewhere, configure the same required environment variables on the target platform.

## Hackathon

AgentDeal was built for the **PayPal + AI Hackathon**.

The project combines AI-powered service procurement, intelligent matching, AI-assisted negotiation, and PayPal Sandbox checkout into a single end-to-end experience.

## Limitations

This hackathon prototype uses a controlled set of demo sellers and AI-powered demo seller agents. It does not claim to search the entire internet or represent real freelancers.

PayPal is used in Sandbox mode for demonstration purposes. Seller payouts are tracked in AgentDeal and handled manually rather than through a claimed PayPal escrow system.

## License

MIT — see [LICENSE](LICENSE).

## Author

**Shomrat Mortaza**

