import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { Empty, ListSkeleton, PageHeader, SellerAvatar } from "@/components/bits";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/admin/sellers")({ head: () => pageHead("Manage sellers (admin)", "All AgentDeal sellers with ratings and earnings."), component: AdminSellers });

function AdminSellers() {
  const { data, isLoading } = useAdmin();
  if (isLoading) return <ListSkeleton />;
  const agents = data?.agents ?? [];
  return <><PageHeader title="Sellers" subtitle={`${agents.length} listings`} />
    {!agents.length ? <Empty icon={Store} title="No sellers" text="Sellers appear once they publish a listing." /> :
      <div className="overflow-x-auto rounded-2xl border bg-card soft-shadow"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-4 font-normal">Seller</th><th className="p-4 font-normal">Category</th><th className="p-4 font-normal">Rating</th><th className="p-4 font-normal">Jobs</th><th className="p-4 font-normal">From</th><th className="p-4 font-normal">Net earnings</th><th className="p-4 font-normal">Status</th></tr></thead>
        <tbody>{agents.map((a) => { const earned = data!.transactions.filter((t) => t.agent_id === a.id && t.status === "completed").reduce((s, t) => s + Number(t.seller_amount), 0); return <tr key={a.id} className="border-b last:border-0"><td className="p-4"><div className="flex items-center gap-3"><SellerAvatar name={a.name} demo={a.is_demo} /><span className="font-medium">{a.name}</span></div></td><td className="p-4 text-muted-foreground">{a.category}</td><td className="p-4">{a.review_count ? `${Number(a.rating).toFixed(1)} (${a.review_count})` : "No reviews"}</td><td className="p-4">{a.completed_jobs}</td><td className="p-4">{money(Number(a.base_price))}</td><td className="p-4 tabular-nums">{money(earned)}</td><td className="p-4 text-xs">{a.is_active ? "Active" : "Hidden"}{a.is_demo ? " · Demo" : ""}</td></tr>; })}</tbody></table></div>}
  </>;
}
