import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminTickets } from "@/lib/support.functions";
import { Card, Empty, PageHeader } from "@/components/bits";
import { SupportThread, statusTone, ticketCategories } from "@/components/support-thread";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/support")({ head: () => pageHead("Support inbox (admin)", "Answer AgentDeal user support tickets."), component: AdminSupport });

function AdminSupport() {
  const fn = useServerFn(adminTickets); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-tickets"], queryFn: () => fn(), refetchInterval: 30000 });
  const [sel, setSel] = useState<string | null>(null); const [filter, setFilter] = useState("open"); const [q, setQ] = useState("");
  const rows = (data ?? []).filter((t) => (filter === "all" || t.status === filter) && `${t.subject} ${t.person?.name} ${t.person?.email} ${t.reference}`.toLowerCase().includes(q.toLowerCase()));
  const current = rows.find((t) => t.id === sel) ?? rows[0];
  const counts = { open: data?.filter((t) => t.status === "open").length ?? 0 };
  return <>
    <PageHeader title="Support inbox" subtitle={`${counts.open} waiting for a reply`} />
    <div className="mb-4 flex flex-wrap gap-3"><Input aria-label="Search tickets" placeholder="Search subject, user or reference" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">{["open", "answered", "closed", "all"].map((s) => <option key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</option>)}</select></div>
    {isLoading ? <Loader2 className="animate-spin text-muted-foreground" /> : error ? <p className="text-destructive">{(error as Error).message}</p> : !rows.length ? <Empty icon={LifeBuoy} title="Nothing here" text="No tickets match this filter." /> :
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="max-h-[70vh] space-y-1 overflow-y-auto p-2">{rows.map((t) => <button key={t.id} onClick={() => setSel(t.id)} className={cn("w-full rounded-xl p-3 text-left hover:bg-secondary", current?.id === t.id && "bg-secondary")}>
          <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{t.subject}</p><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize", statusTone[t.status])}>{t.status}</span></div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{t.person?.name ?? "User"} · {t.person?.email} · {ticketCategories.find((c) => c.v === t.category)?.l}</p></button>)}</Card>
        {current && <Card className="min-h-[480px]"><SupportThread key={current.id} ticket={current} staff onChanged={() => qc.invalidateQueries({ queryKey: ["admin-tickets"] })} /></Card>}
      </div>}
  </>;
}
