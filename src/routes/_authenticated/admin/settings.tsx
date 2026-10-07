import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/bits";
import { COMMISSION_RATE, WEIGHTS } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/admin/settings")({ head: () => pageHead("Platform settings", "AgentDeal commission and matching configuration."), component: Settings });

function Settings() {
  return <><PageHeader title="Platform settings" />
    <div className="grid max-w-3xl gap-4">
      <Card><p className="text-xs text-muted-foreground">Commission rate</p><p className="display mt-2 text-4xl font-semibold">{COMMISSION_RATE * 100}%</p><p className="mt-2 text-sm text-muted-foreground">Taken from each released payment. Sellers receive {100 - COMMISSION_RATE * 100}%.</p></Card>
      <Card><p className="mb-4 text-xs text-muted-foreground">Matching weights</p><dl className="space-y-2 text-sm">{Object.entries(WEIGHTS).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="capitalize">{k === "skills" ? "Skill match" : k === "quality" ? "Offer quality" : k === "price" ? "Price fit" : k === "delivery" ? "Delivery speed" : "Rating"}</dt><dd className="tabular-nums">{v * 100}%</dd></div>)}</dl></Card>
      <Card><p className="text-xs text-muted-foreground">Payments</p><p className="mt-2 text-sm">PayPal test mode. Captured payments go to the platform's PayPal account and are tracked as Held until the buyer confirms. Seller payouts are sent manually and marked in Transactions.</p></Card>
    </div></>;
}
