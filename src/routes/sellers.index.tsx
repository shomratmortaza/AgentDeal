import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Star, Clock3, Store, Search, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RatingBadge } from "@/components/rating";
import { pageHead } from "@/lib/head";
import { money } from "@/lib/market";
import { Empty, ListSkeleton } from "@/components/bits";
import { Input } from "@/components/ui/input";
import { PublicHeader, Avatar } from "@/components/public-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sellers/")({
  head: () => pageHead("Sellers", "Browse AgentDeal sellers — ratings, starting prices, skills and delivery times."),
  component: Sellers,
});

function Sellers() {
  const { data, isLoading, error } = useQuery({ queryKey: ["public-sellers"], queryFn: async () => { const { data, error } = await supabase.from("provider_agents").select("*").eq("is_active", true).order("review_count", { ascending: false }).order("rating", { ascending: false }); if (error) throw error; return data; } });
  const [q, setQ] = useState(""); const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set((data ?? []).map((a) => a.category)))], [data]);
  const list = (data ?? []).filter((a) => (cat === "All" || a.category === cat) && (!q || `${a.name} ${a.description} ${a.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase())));
  return <div className="relative min-h-screen overflow-hidden bg-background">
    <div className="hero-glow" /><div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
    <PublicHeader />
    <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16">
      <p className="text-sm font-medium text-muted-foreground">Marketplace</p>
      <h1 className="display text-gradient mt-3 text-5xl font-semibold md:text-6xl">Find your seller.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Open any profile to see skills and pricing, then message them directly. Sellers marked <strong className="font-medium text-foreground">Demo</strong> are example profiles run by AI agents, not real people.</p>
      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search sellers by skill or name" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search skills or names" className="h-11 rounded-full pl-10" /></div>
        <div className="flex flex-wrap gap-1.5">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={cn("h-9 rounded-full px-4 text-[13px] transition", cat === c ? "bg-foreground text-background" : "hairline bg-card text-muted-foreground hover:text-foreground")}>{c}</button>)}</div>
      </div>
      <div className="mt-10">{isLoading ? <ListSkeleton /> : error ? <p className="text-destructive">{error.message}</p> : !list.length ? <Empty icon={Store} title="No sellers found" text="Try a different search or category." /> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((a) =>
          <Link key={a.id} to="/sellers/$id" params={{ id: a.id }} className="lift group flex flex-col rounded-3xl border bg-card p-6 soft-shadow">
            <div className="flex items-center gap-3"><Avatar name={a.name} demo={a.is_demo} /><div className="min-w-0 flex-1"><h2 className="font-semibold">{a.name}</h2><p className="text-xs text-muted-foreground">{a.category}{a.is_demo ? " · Demo seller" : ""}</p></div><ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-foreground" /></div>
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{a.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{a.skills.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">{s}</span>)}</div>
            <div className="mt-auto flex justify-between border-t pt-4 text-xs [&]:mt-5"><span>From <strong>{money(Number(a.base_price))}</strong></span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{a.delivery_hours}h</span><RatingBadge rating={a.rating} count={a.review_count} /></div>
          </Link>)}</div>}</div>
    </div>
  </div>;
}
