import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Inbox, ChevronRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { Empty, ListSkeleton, PageHeader, Stat, StatusBadge } from "@/components/bits";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/dashboard")({ head: () => pageHead("Dashboard", "Your AgentDeal requests, jobs and earnings at a glance."), component: Dashboard });

function Dashboard() {
  const { data: account } = useAccount();
  if (!account) return null;
  if (account.role === "seller") return <SellerDash />;
  if (account.role === "buyer") return <BuyerDash />;
  return <PageHeader title="Welcome, admin" subtitle="Use the Admin section in the sidebar to manage the platform." action={<div className="flex gap-2"><Button asChild variant="outline" className="rounded-full"><Link to="/onboarding">Also use as buyer or seller</Link></Button><Button asChild className="rounded-full"><Link to="/admin">Open admin</Link></Button></div>} />;
}

function RequestRow({ r, to }: { r: { id: string; title: string; status: string; budget: number | null; created_at: string; conversations?: { id: string }[] | { id: string } | null }; to: "request" }) {
  const conv = Array.isArray(r.conversations) ? r.conversations[0] : r.conversations;
  const inner = <><div className="min-w-0"><p className="truncate font-medium">{r.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()} · Budget {r.budget ? money(r.budget) : "not set"}</p></div><div className="flex items-center gap-3"><StatusBadge status={r.status} /><ChevronRight className="size-4 text-muted-foreground" /></div></>;
  const cls = "flex items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 transition-colors hover:bg-secondary/50";
  void to;
  return conv ? <Link to="/deals/$id" params={{ id: conv.id }} className={cls}>{inner}</Link> : <Link to="/new" search={{ request: r.id }} className={cls}>{inner}</Link>;
}

function BuyerDash() {
  const { data, isLoading } = useQuery({ queryKey: ["buyer-dash"], queryFn: async () => {
    const [{ data: reqs }, { data: txs }] = await Promise.all([supabase.from("service_requests").select("*, conversations(id)").order("created_at", { ascending: false }), supabase.from("transactions").select("amount,status")]);
    return { reqs: reqs ?? [], spent: (txs ?? []).filter((t) => t.status === "held" || t.status === "completed").reduce((s, t) => s + Number(t.amount), 0) };
  } });
  const active = data?.reqs.filter((r) => !["completed", "cancelled"].includes(r.status)) ?? [];
  const done = data?.reqs.filter((r) => r.status === "completed") ?? [];
  return <>
    <PageHeader title="Dashboard" subtitle="Your requests and spending." action={<Button asChild className="rounded-full"><Link to="/new" search={{}}><Plus />New request</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Active requests" value={isLoading ? "—" : active.length} /><Stat label="Completed" value={isLoading ? "—" : done.length} /><Stat label="Total spent" value={isLoading ? "—" : money(data?.spent)} /></div>
    <h2 className="mb-4 mt-12 text-lg font-semibold">Requests</h2>
    {isLoading ? <ListSkeleton /> : !data?.reqs.length ? <Empty icon={Inbox} title="No requests yet" text="Describe what you need and AI will find the three best sellers." action={<Button asChild className="rounded-full"><Link to="/new" search={{}}>Create your first request</Link></Button>} /> : <div className="space-y-2">{data.reqs.map((r) => <RequestRow key={r.id} r={r as never} to="request" />)}</div>}
  </>;
}

function SellerDash() {
  const { data: account } = useAccount();
  const { data, isLoading } = useQuery({ queryKey: ["seller-dash"], enabled: !!account?.listing, queryFn: async () => {
    const [{ data: offers }, { data: convs }, { data: txs }] = await Promise.all([
      supabase.from("offers").select("*, service_requests(*)").in("agent_id", account!.listings.map((l) => l.id)).order("created_at", { ascending: false }),
      supabase.from("conversations").select("*, service_requests(title,status)").eq("seller_id", account!.profile!.id).order("updated_at", { ascending: false }),
      supabase.from("transactions").select("seller_amount,status"),
    ]);
    return { offers: offers ?? [], convs: convs ?? [], earned: (txs ?? []).filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.seller_amount), 0) };
  } });
  if (!account?.listing) return <><PageHeader title="Dashboard" /><Empty icon={Store} title="Publish your listing" text="Buyers can only be matched with you once your listing is live." action={<Button asChild className="rounded-full"><Link to="/listing">Create listing</Link></Button>} /></>;
  const activeJobs = data?.convs.filter((c) => !["completed", "cancelled"].includes(c.service_requests?.status ?? "")) ?? [];
  return <>
    <PageHeader title="Dashboard" subtitle={account.listings.length > 1 ? `${account.listings.length} listings` : `Listing: ${account.listing.name}`} />
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Matched requests" value={isLoading ? "—" : data?.offers.length ?? 0} /><Stat label="Active jobs" value={isLoading ? "—" : activeJobs.length} /><Stat label="Net earnings" value={isLoading ? "—" : money(data?.earned)} hint="After platform commission" /></div>
    <h2 className="mb-4 mt-12 text-lg font-semibold">Jobs</h2>
    {isLoading ? <ListSkeleton /> : !data?.convs.length ? <Empty icon={Inbox} title="No jobs yet" text="When a buyer selects you, the private chat appears here." /> : <div className="space-y-2">{data.convs.map((c) => <Link key={c.id} to="/deals/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4 hover:bg-secondary/50"><div><p className="font-medium">{c.service_requests?.title}</p><p className="mt-1 text-xs text-muted-foreground">Agreed {money(Number(c.agreed_price))}</p></div><StatusBadge status={c.service_requests?.status ?? ""} /></Link>)}</div>}
    <h2 className="mb-4 mt-12 text-lg font-semibold">Matched requests</h2>
    {isLoading ? <ListSkeleton /> : !data?.offers.length ? <Empty icon={Inbox} title="No matches yet" text="You'll appear here whenever you're ranked in a buyer's top 3." /> : <div className="space-y-2">{data.offers.map((o) => <div key={o.id} className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4"><div className="min-w-0"><p className="truncate font-medium">{o.service_requests?.title}</p><p className="mt-1 text-xs text-muted-foreground">Rank #{o.rank} · AI Score {o.ai_score} · {o.status === "selected" ? "Selected you" : o.status === "declined" ? "Chose another seller" : "Buyer is deciding"}</p></div><span className="text-sm tabular-nums">{money(Number(o.price))}</span></div>)}</div>}
  </>;
}
