import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAdmin, useRefreshAdmin } from "@/hooks/use-admin";
import { adminMarkPayout } from "@/lib/market.functions";
import { Empty, ListSkeleton, PageHeader, Stat, StatusBadge } from "@/components/bits";
import { money, txStatus } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/admin/transactions")({ head: () => pageHead("All transactions (admin)", "All AgentDeal payments, held funds and commission."), component: AdminTx });

const payout: Record<string, string> = { manual_pending: "Payout due", paid_out: "Paid out", not_due: "Not due", demo_no_payout: "Demo seller" };

function AdminTx() {
  const { data, isLoading } = useAdmin(); const refresh = useRefreshAdmin(); const mark = useServerFn(adminMarkPayout);
  const [f, setF] = useState("all");
  const all = data?.transactions ?? []; const rows = all.filter((t) => f === "all" || t.status === f);
  const held = all.filter((t) => t.status === "held").reduce((s, t) => s + Number(t.amount), 0);
  const fee = all.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.platform_fee), 0);
  const due = all.filter((t) => t.payout_status === "manual_pending").reduce((s, t) => s + Number(t.seller_amount), 0);
  return <><PageHeader title="Transactions" />
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Held in escrow" value={money(held)} /><Stat label="Commission earned" value={money(fee)} /><Stat label="Seller payouts due" value={money(due)} hint="Send via PayPal, then mark paid" /></div>
    <div className="my-6 flex flex-wrap gap-2">{["all", ...Object.keys(txStatus)].map((k) => <Button key={k} size="sm" variant={f === k ? "default" : "outline"} className="rounded-full" onClick={() => setF(k)}>{k === "all" ? "All" : txStatus[k]}</Button>)}</div>
    {isLoading ? <ListSkeleton /> : !rows.length ? <Empty icon={Receipt} title="No transactions" text="Nothing matches this filter." /> :
      <div className="overflow-x-auto rounded-2xl border bg-card soft-shadow"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-4 font-normal">Request</th><th className="p-4 font-normal">Seller</th><th className="p-4 font-normal">Amount</th><th className="p-4 font-normal">Fee</th><th className="p-4 font-normal">Seller</th><th className="p-4 font-normal">Status</th><th className="p-4 font-normal">Payout</th><th className="p-4 font-normal">PayPal order</th></tr></thead>
        <tbody>{rows.map((t) => <tr key={t.id} className="border-b last:border-0"><td className="p-4 font-medium">{t.service_requests?.title}</td><td className="p-4 text-muted-foreground">{t.provider_agents?.name}</td><td className="p-4 tabular-nums">{money(Number(t.amount))}</td><td className="p-4 tabular-nums">{money(Number(t.platform_fee))}</td><td className="p-4 tabular-nums">{money(Number(t.seller_amount))}</td><td className="p-4"><StatusBadge kind="tx" status={t.status} /></td><td className="p-4 text-xs">{t.payout_status === "manual_pending" ? <Button size="sm" variant="outline" onClick={async () => { try { await mark({ data: { transactionId: t.id } }); toast.success("Marked as paid out"); refresh(); } catch (e) { toast.error((e as Error).message); } }}>Mark paid out</Button> : payout[t.payout_status] ?? t.payout_status}</td><td className="p-4 font-mono text-[11px] text-muted-foreground">{t.paypal_order_id}</td></tr>)}</tbody></table></div>}
  </>;
}
