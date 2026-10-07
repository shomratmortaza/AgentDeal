import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUp, Star, Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { extractBrief } from "@/lib/procurement.functions";
import { matchSellers, selectSeller, chooseRole } from "@/lib/market.functions";
import { confirmedSchema, examples, type Brief } from "@/lib/procurement";
import { money, WEIGHTS } from "@/lib/market";
import { SellerAvatar } from "@/components/bits";
import { useAccount } from "@/hooks/use-account";
import { RatingBadge } from "@/components/rating";
import { pageHead } from "@/lib/head";
import { Mark } from "@/components/logo";

export const Route = createFileRoute("/_authenticated/new")({
  validateSearch: (s: Record<string, unknown>): { request?: string } => (typeof s["request"] === "string" ? { request: s["request"] as string } : {}),
  head: () => pageHead("New request", "Describe what you need and AgentDeal's AI ranks the three best sellers."),
  component: NewRequest,
});

const Bubble = ({ children }: { children: React.ReactNode }) => <div className="flex gap-3"><span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card"><Mark className="w-4" /></span><div className="min-w-0 flex-1 text-[15px] leading-7">{children}</div></div>;

function NewRequest() {
  const { request } = Route.useSearch();
  const { data: account } = useAccount();
  const navigate = useNavigate(); const qc = useQueryClient();
  const pickRole = useServerFn(chooseRole); const extract = useServerFn(extractBrief); const match = useServerFn(matchSellers); const select = useServerFn(selectSeller);
  const [text, setText] = useState(""); const [sent, setSent] = useState(""); const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState<"" | "extract" | "match" | string>("");

  const offersQ = useQuery({ queryKey: ["offers", request], enabled: !!request, queryFn: async () => {
    const { data: req } = await supabase.from("service_requests").select("*").eq("id", request!).single();
    const { data: offers } = await supabase.from("offers").select("*, provider_agents(*)").eq("request_id", request!).order("rank");
    return { req, offers: offers ?? [] };
  } });

  if (!account) return <Skeleton className="h-40 w-full max-w-xl" />;
  if (account.role === "seller") return <div className="max-w-xl rounded-2xl border bg-card p-8"><h2 className="text-xl font-semibold">Requests are for buyers</h2><p className="mt-2 text-sm text-muted-foreground">This account sells services. Use a separate buyer account to post a request.</p><Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/dashboard" })}>Go to dashboard</Button></div>;
  if (account.role !== "buyer") return <div className="max-w-xl rounded-2xl border bg-card p-8"><h2 className="text-xl font-semibold">Start buying on AgentDeal</h2><p className="mt-2 text-sm text-muted-foreground">Turn on buying for your account to describe a request and get matched with sellers. This is a one-time choice; your admin access stays.</p><Button className="mt-6 rounded-full" disabled={busy === "role"} onClick={async () => { setBusy("role"); try { await pickRole({ data: { role: "buyer", name: (account.profile?.name && account.profile.name.length >= 2 ? account.profile.name : "Buyer").slice(0, 80) } }); await qc.invalidateQueries({ queryKey: ["account"] }); toast.success("Buying is on. Describe what you need."); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not turn on buying."); } finally { setBusy(""); } }}>{busy === "role" ? <Loader2 className="animate-spin" /> : null}Turn on buying</Button></div>;

  const send = async () => {
    if (text.trim().length < 15) { toast.error("Add a little more detail (at least 15 characters)."); return; }
    setSent(text.trim()); setBrief(null); setBusy("extract");
    try { const r = await extract({ data: { text: text.trim() } }); if (!r.ok) toast.error(r.error); else { setBrief(r.brief); setText(""); } } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  };
  const findSellers = async () => {
    const parsed = confirmedSchema.safeParse({ raw_request: sent, brief: { ...brief, currency: brief?.currency?.toUpperCase() ?? "USD" } });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.path.join(".") + ": " + parsed.error.issues[0]?.message); return; }
    setBusy("match");
    try { const r = await match({ data: parsed.data }); await qc.invalidateQueries({ queryKey: ["buyer-dash"] }); navigate({ to: "/new", search: { request: r.requestId } }); } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  };
  const choose = async (offerId: string) => {
    setBusy(offerId);
    try { const r = await select({ data: { offerId } }); toast.success("Seller connected"); navigate({ to: "/deals/$id", params: { id: r.conversationId } }); } catch (e) { toast.error((e as Error).message); setBusy(""); }
  };
  const upd = (patch: Partial<Brief>) => setBrief((b) => (b ? { ...b, ...patch } : b));

  if (request) {
    const d = offersQ.data;
    return <div className="mx-auto max-w-3xl space-y-8">
      {offersQ.isLoading || !d ? <><Skeleton className="h-10 w-2/3" />{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</> : <>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-5 py-3 text-[15px] text-primary-foreground">{d.req?.raw_request}</div>
        <Bubble><p>Here are the three best sellers for <strong>{d.req?.title}</strong>. Scores weigh price fit {WEIGHTS.price * 100}%, delivery speed {WEIGHTS.delivery * 100}%, rating {WEIGHTS.rating * 100}%, skill match {WEIGHTS.skills * 100}% and offer quality {WEIGHTS.quality * 100}%.</p></Bubble>
        <div className="space-y-4">{d.offers.map((o) => { const a = o.provider_agents!; const bd = o.score_breakdown as Record<string, number>; return <article key={o.id} className="rounded-2xl border bg-card p-6 soft-shadow">
          <div className="flex items-start gap-4"><SellerAvatar name={a.name} demo={a.is_demo} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{a.name}</h3>{a.is_demo && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">Demo seller · AI agent</span>}{o.rank === 1 && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-primary">Best match</span>}</div><div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground"><RatingBadge rating={a.rating} count={a.review_count} /><span className="flex items-center gap-1"><Clock3 className="size-3" />{o.delivery_hours}h</span><span>{money(Number(o.price))}</span></div></div><div className="text-right"><p className="display text-3xl font-semibold tabular-nums">{o.ai_score}</p><p className="text-[10px] text-muted-foreground">AI Score</p></div></div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{o.ai_reason}</p>
          <div className="mt-4 grid grid-cols-5 gap-2">{(["price", "delivery", "rating", "skills", "quality"] as const).map((k) => <div key={k}><div className="h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${bd?.[k] ?? 0}%` }} /></div><p className="mt-1.5 text-[10px] capitalize text-muted-foreground">{k} {bd?.[k] ?? 0}</p></div>)}</div>
          {d.req?.status === "matched" ? <Button className="mt-5 rounded-full" disabled={!!busy} onClick={() => choose(o.id)}>{busy === o.id ? <Loader2 className="animate-spin" /> : null}Select & Connect</Button> : <p className="mt-5 text-xs text-muted-foreground">{o.status === "selected" ? "You selected this seller." : "Not selected."}</p>}
        </article>; })}</div>
      </>}
    </div>;
  }

  return <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-3xl flex-col">
    <div className="flex-1 space-y-8">
      {!sent && <div className="pt-16 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-card soft-shadow"><Mark className="w-8" /></span><h1 className="display mt-6 text-4xl font-semibold">What do you need?</h1><p className="mt-3 text-muted-foreground">Describe it in your own words. Include budget and deadline if you know them.</p>
        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">{examples.map((e) => <button key={e.title} onClick={() => setText(e.text)} className="rounded-2xl border bg-card p-4 text-sm transition-colors hover:bg-secondary/60"><p className="font-medium">{e.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.text}</p></button>)}</div></div>}
      {sent && <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-5 py-3 text-[15px] text-primary-foreground">{sent}</div>}
      {busy === "extract" && <Bubble><span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Understanding your request…</span></Bubble>}
      {brief && <Bubble>
        <p>Here's what I understood. Adjust anything, then I'll rank the sellers.</p>
        <div className="mt-4 space-y-4 rounded-2xl border bg-card p-5 soft-shadow">
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Service<Input className="mt-1.5 rounded-lg" value={brief.service} onChange={(e) => upd({ service: e.target.value })} /></label><label className="text-xs text-muted-foreground">Category<select className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground" value={brief.category} onChange={(e) => upd({ category: e.target.value })}>{["Video production", "Design", "Development", "Writing", "Other", ...(["Video production", "Design", "Development", "Writing", "Other"].includes(brief.category) ? [] : [brief.category])].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Budget (USD)<Input type="number" min={1} className="mt-1.5 rounded-lg" value={brief.budget ?? ""} onChange={(e) => upd({ budget: e.target.value ? Number(e.target.value) : null })} /></label><label className="text-xs text-muted-foreground">Deadline (hours)<Input type="number" min={1} className="mt-1.5 rounded-lg" value={brief.deadline_hours ?? ""} onChange={(e) => upd({ deadline_hours: e.target.value ? Number(e.target.value) : null })} /></label></div>
          <label className="block text-xs text-muted-foreground">Requirements (one per line)<textarea rows={4} className="mt-1.5 w-full rounded-lg border bg-background p-3 text-sm text-foreground" value={brief.requirements.join("\n")} onChange={(e) => upd({ requirements: e.target.value.split("\n") })} onBlur={() => upd({ requirements: brief.requirements.map((r) => r.trim()).filter(Boolean) })} /></label>
          {brief.clarification && <p className="rounded-lg bg-secondary p-3 text-xs">{brief.clarification}</p>}
          <Button className="rounded-full" disabled={busy === "match"} onClick={findSellers}>{busy === "match" && <Loader2 className="animate-spin" />}Find the best sellers</Button>
        </div>
      </Bubble>}
    </div>
    <div className="sticky bottom-4 mt-8"><div className="flex items-end gap-2 rounded-3xl border bg-card p-2 pl-5 soft-shadow"><textarea rows={2} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="e.g. A 30-second promo video for my café, $100, within 48 hours" className="intake-input flex-1 bg-transparent py-2 text-[15px]" /><Button size="icon" className="rounded-full" disabled={busy === "extract" || !text.trim()} onClick={send} aria-label="Send"><ArrowUp /></Button></div></div>
  </div>;
}
