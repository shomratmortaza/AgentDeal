import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, ListSkeleton, PageHeader, StatusBadge } from "@/components/bits";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/transactions")({ head: () => pageHead("My transactions", "Your full AgentDeal payment history."), component: Tx });

function Tx() {
  const { data, isLoading } = useQuery({ queryKey: ["my-tx"], queryFn: async () => { const { data, error } = await supabase.from("transactions").select("*, provider_agents(name), service_requests(title)").neq("status", "pending").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  return <><PageHeader title="Transactions" subtitle="Every payment, with fee and seller share." />
    {isLoading ? <ListSkeleton /> : !data?.length ? <Empty icon={Receipt} title="No transactions yet" text="Payments appear here once PayPal confirms them." /> :
      <div className="overflow-x-auto rounded-2xl border bg-card soft-shadow"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-4 font-normal">Request</th><th className="p-4 font-normal">Seller</th><th className="p-4 font-normal">Amount</th><th className="p-4 font-normal">Fee</th><th className="p-4 font-normal">Seller gets</th><th className="p-4 font-normal">Status</th><th className="p-4 font-normal">Date</th></tr></thead>
        <tbody>{data.map((t) => <tr key={t.id} className="border-b last:border-0"><td className="p-4"><Link to="/deals/$id" params={{ id: t.conversation_id }} className="font-medium hover:text-primary">{t.service_requests?.title}</Link></td><td className="p-4 text-muted-foreground">{t.provider_agents?.name}</td><td className="p-4 tabular-nums">{money(Number(t.amount))}</td><td className="p-4 tabular-nums text-muted-foreground">{money(Number(t.platform_fee))}</td><td className="p-4 tabular-nums">{money(Number(t.seller_amount))}</td><td className="p-4"><StatusBadge kind="tx" status={t.status} /></td><td className="p-4 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
  </>;
}
