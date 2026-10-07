import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, ListSkeleton, PageHeader, Stat, StatusBadge } from "@/components/bits";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/earnings")({ head: () => pageHead("Earnings", "Gross, platform fee and net earnings for your AgentDeal jobs."), component: Earnings });

const payout: Record<string, string> = { manual_pending: "Payout pending", paid_out: "Paid out", not_due: "Not yet due", demo_no_payout: "—" };

function Earnings() {
  const { data, isLoading } = useQuery({ queryKey: ["earnings"], queryFn: async () => { const { data, error } = await supabase.from("transactions").select("*, service_requests(title)").in("status", ["held", "completed", "refunded"]).order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const done = (data ?? []).filter((t) => t.status === "completed");
  const sum = (k: "amount" | "platform_fee" | "seller_amount") => done.reduce((s, t) => s + Number(t[k]), 0);
  const held = (data ?? []).filter((t) => t.status === "held").reduce((s, t) => s + Number(t.seller_amount), 0);
  return <><PageHeader title="Earnings" subtitle="Released amounts after buyer confirmation." />
    <div className="grid gap-4 sm:grid-cols-4"><Stat label="Gross" value={money(sum("amount"))} /><Stat label="Platform commission" value={money(sum("platform_fee"))} /><Stat label="Net received" value={money(sum("seller_amount"))} /><Stat label="Held for you" value={money(held)} hint="Released on confirmation" /></div>
    <div className="mt-10">{isLoading ? <ListSkeleton /> : !data?.length ? <Empty icon={Wallet} title="No earnings yet" text="Once a buyer pays and confirms delivery, your earnings show up here." /> :
      <div className="space-y-2">{data.map((t) => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4"><div><p className="font-medium">{t.service_requests?.title}</p><p className="mt-1 text-xs text-muted-foreground">Gross {money(Number(t.amount))} · Fee {money(Number(t.platform_fee))} · {payout[t.payout_status] ?? t.payout_status}</p></div><div className="flex items-center gap-3"><span className="font-semibold tabular-nums">{money(Number(t.seller_amount))}</span><StatusBadge kind="tx" status={t.status} /></div></div>)}</div>}</div>
  </>;
}
