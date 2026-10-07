// Shared, browser-safe marketplace rules: commission math, transparent seller scoring, status labels.
export const COMMISSION_RATE = 0.07;

export function splitAmount(amount: number) {
  const cents = Math.round(amount * 100);
  const fee = Math.round(cents * COMMISSION_RATE);
  return { amount: cents / 100, platformFee: fee / 100, sellerAmount: (cents - fee) / 100 };
}

export const money = (n: number | null | undefined, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(n ?? 0));

export const WEIGHTS = { price: 0.35, delivery: 0.3, rating: 0.2, skills: 0.1, quality: 0.05 } as const;

export type ScoreInput = {
  budget: number | null; deadlineHours: number | null; category: string; text: string;
  agent: { name: string; base_price: number; delivery_hours: number; rating: number; review_count?: number; skills: string[]; category: string; quality_score: number };
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ");

export function scoreSeller({ budget, deadlineHours, category, text, agent }: ScoreInput) {
  const price = Number(agent.base_price);
  const priceFit = budget ? (price <= budget ? 1 : clamp(1 - (price - budget) / budget)) : 0.7;
  const delivery = deadlineHours ? (agent.delivery_hours <= deadlineHours ? 1 : clamp(1 - (agent.delivery_hours - deadlineHours) / deadlineHours)) : clamp(1 - agent.delivery_hours / 168);
  const rating = agent.review_count ? clamp((Number(agent.rating) - 3) / 2) : 0.5; // unreviewed sellers get a neutral score
  const hay = norm(`${text} ${category}`);
  const catA = norm(agent.category).trim().split(" ")[0] ?? "";
  const catB = norm(category);
  const categoryMatch = catA.length > 2 && (catB.includes(catA) || catA.startsWith(catB.trim().split(" ")[0]?.slice(0, 4) ?? "~"));
  const hits = agent.skills.filter((s) => norm(s).split(" ").some((w) => w.length > 2 && hay.includes(w)));
  const skills = clamp((categoryMatch ? 0.6 : 0) + 0.2 * hits.length);
  const quality = clamp(agent.quality_score / 100);
  const parts = { price: priceFit, delivery, rating, skills, quality };
  const score = Math.round(100 * (parts.price * WEIGHTS.price + parts.delivery * WEIGHTS.delivery + parts.rating * WEIGHTS.rating + parts.skills * WEIGHTS.skills + parts.quality * WEIGHTS.quality));
  const reasons: string[] = [];
  if (budget) reasons.push(price <= budget ? `${money(price)} fits your ${money(budget)} budget` : `${money(price)} is ${money(price - budget)} over your budget`);
  else reasons.push(`priced at ${money(price)} (no budget given)`);
  if (deadlineHours) reasons.push(agent.delivery_hours <= deadlineHours ? `delivers in ${agent.delivery_hours}h, within your ${deadlineHours}h deadline` : `needs ${agent.delivery_hours}h, longer than your ${deadlineHours}h deadline`);
  else reasons.push(`delivers in ${agent.delivery_hours}h`);
  reasons.push(agent.review_count ? `rated ${Number(agent.rating).toFixed(1)} from ${agent.review_count} review${agent.review_count === 1 ? "" : "s"}` : "no reviews yet");
  reasons.push(categoryMatch ? (hits.length ? `specialises in ${hits.slice(0, 2).join(" and ")}` : `works in ${agent.category}`) : "outside the main category of your request");
  const reason = `${agent.name} ${reasons.join(", ")}.`.replace(/^(\w)/, (m) => m.toUpperCase());
  const breakdown = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v * 100)]));
  return { score, reason, breakdown, categoryMatch };
}

export const requestStatus: Record<string, string> = {
  matched: "Choosing seller", negotiating: "Negotiating", in_escrow: "Payment held", delivered: "Delivered", completed: "Completed", cancelled: "Cancelled", draft: "Draft",
};
export const txStatus: Record<string, string> = { pending: "Pending", held: "Held", completed: "Completed", refunded: "Refunded" };
