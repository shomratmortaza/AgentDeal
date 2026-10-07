import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { threadPeople } from "@/lib/dm.functions";
import { useAccount } from "@/hooks/use-account";
import { Empty, ListSkeleton, PageHeader, StatusBadge } from "@/components/bits";
import { Avatar } from "@/components/public-header";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/messages/")({ head: () => pageHead("Messages", "Your private conversations with buyers and sellers."), component: Inbox });

type Row = { key: string; to: "dm" | "deal"; id: string; title: string; sub: string; avatar: string | null; demo: boolean; at: string; status?: string };

export function useInbox() {
  const { data: account } = useAccount(); const people = useServerFn(threadPeople);
  return useQuery({ queryKey: ["inbox", account?.profile?.id], enabled: !!account?.profile?.id, queryFn: async () => {
    const me = account!.profile!.id;
    const [{ data: th }, { data: cv }] = await Promise.all([
      supabase.from("direct_threads").select("*, provider_agents(name, is_demo, category)").order("last_message_at", { ascending: false }),
      supabase.from("conversations").select("*, provider_agents(name, is_demo, category), service_requests(title, status)").order("updated_at", { ascending: false }),
    ]);
    const others = [...(th ?? []), ...(cv ?? [])].map((r) => (r.buyer_id === me ? r.seller_id : r.buyer_id)).filter(Boolean) as string[];
    const ppl = others.length ? await people({ data: { ids: Array.from(new Set(others)) } }) : {};
    const rows: Row[] = [
      ...(th ?? []).map((t) => { const iAmBuyer = t.buyer_id === me; const p = iAmBuyer ? (t.seller_id ? ppl[t.seller_id] : null) : ppl[t.buyer_id]; return { key: "t" + t.id, to: "dm" as const, id: t.id, title: iAmBuyer ? t.provider_agents?.name ?? "Seller" : p?.name ?? "Buyer", sub: iAmBuyer ? `${t.provider_agents?.category ?? ""} · Direct message` : "Direct message", avatar: p?.avatar_url ?? null, demo: iAmBuyer && !!t.provider_agents?.is_demo, at: t.last_message_at }; }),
      ...(cv ?? []).map((c) => { const iAmBuyer = c.buyer_id === me; const p = iAmBuyer ? (c.seller_id ? ppl[c.seller_id] : null) : ppl[c.buyer_id]; return { key: "c" + c.id, to: "deal" as const, id: c.id, title: iAmBuyer ? c.provider_agents?.name ?? "Seller" : p?.name ?? "Buyer", sub: c.service_requests?.title ?? "Deal", avatar: p?.avatar_url ?? null, demo: iAmBuyer && !!c.provider_agents?.is_demo, at: c.updated_at, status: c.service_requests?.status }; }),
    ];
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  } });
}

function Inbox() {
  const q = useInbox();
  return <>
    <PageHeader title="Messages" subtitle="Direct messages and deal chats in one place." action={<Button asChild variant="outline" className="rounded-full"><Link to="/sellers">Find a seller</Link></Button>} />
    {q.isLoading ? <ListSkeleton /> : !q.data?.length ? <Empty icon={MessageCircle} title="No conversations yet" text="Open a seller's profile and press Message to start a private chat." action={<Button asChild className="rounded-full"><Link to="/sellers">Browse sellers</Link></Button>} /> :
      <div className="overflow-hidden rounded-3xl border bg-card soft-shadow">{q.data.map((r) =>
        <Link key={r.key} to={r.to === "dm" ? "/messages/$id" : "/deals/$id"} params={{ id: r.id }} className="flex items-center gap-4 border-b px-5 py-4 transition last:border-0 hover:bg-secondary/60">
          <Avatar name={r.title} src={r.avatar} demo={r.demo} />
          <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.title}</p><p className="truncate text-sm text-muted-foreground">{r.sub}</p></div>
          <div className="flex flex-col items-end gap-1">{r.status && <StatusBadge status={r.status} />}<span className="text-[11px] text-muted-foreground">{new Date(r.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>
        </Link>)}</div>}
  </>;
}
