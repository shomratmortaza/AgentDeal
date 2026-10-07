import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Paperclip, ArrowUp, Loader2, FileText, CreditCard, PackageCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { demoAgentReply, markDelivered, confirmDelivery, sellerSetPrice } from "@/lib/market.functions";
import { money, splitAmount } from "@/lib/market";
import { Card, SellerAvatar, StatusBadge, Timeline } from "@/components/bits";
import { useAccount } from "@/hooks/use-account";
import { ReviewBox } from "@/components/review-box";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";
import { Linkify } from "@/components/linkify";

export const Route = createFileRoute("/_authenticated/deals/$id")({ head: () => pageHead("Deal", "Private negotiation, payment status and delivery for your AgentDeal job."), component: Deal });

type Msg = { id: string; sender_kind: string; sender_id: string | null; content: string; file_url: string | null; file_name: string | null; created_at: string };

function FileLink({ path, name }: { path: string; name: string }) {
  return <Button variant="outline" className="mt-2 flex items-center gap-2 rounded-lg border bg-background/60 px-3 py-2 text-xs text-foreground" onClick={async () => { const { data, error } = await supabase.storage.from("chat-files").createSignedUrl(path, 300); if (error) toast.error(error.message); else window.open(data.signedUrl, "_blank", "noopener"); }}><FileText className="size-3.5" />{name}</Button>;
}

function Deal() {
  const { id } = Route.useParams();
  const { data: account } = useAccount(); const qc = useQueryClient();
  const reply = useServerFn(demoAgentReply); const deliver = useServerFn(markDelivered); const confirm = useServerFn(confirmDelivery); const setPrice = useServerFn(sellerSetPrice);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(""); const [note, setNote] = useState(""); const [newPrice, setNewPrice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const q = useQuery({ queryKey: ["deal", id], queryFn: async () => {
    const [{ data: conv, error }, { data: msgs }, { data: txs }] = await Promise.all([
      supabase.from("conversations").select("*, provider_agents(*), service_requests(*)").eq("id", id).single(),
      supabase.from("messages").select("*").eq("conversation_id", id).order("created_at"),
      supabase.from("transactions").select("*").eq("conversation_id", id).order("created_at", { ascending: false }),
    ]);
    if (error) throw error;
    return { conv, msgs: (msgs ?? []) as Msg[], tx: (txs ?? []).find((t) => t.status !== "pending") ?? null };
  } });

  useEffect(() => {
    const ch = supabase.channel(`deal-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (p) => qc.setQueryData(["deal", id], (old: any) => old && !old.msgs.some((m: Msg) => m.id === (p.new as Msg).id) ? { ...old, msgs: [...old.msgs, p.new] } : old))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["deal", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `conversation_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["deal", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [q.data?.msgs.length]);

  if (q.isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-[480px] rounded-2xl" /></div>;
  if (q.error || !q.data?.conv) return <p className="text-destructive">This deal couldn't be loaded.</p>;
  const { conv, msgs, tx } = q.data; const agent = conv.provider_agents; const req = conv.service_requests;
  if (!agent || !req) return <p className="text-muted-foreground">This deal is unavailable.</p>;
  const me = account?.profile?.id; const isBuyer = conv.buyer_id === me; const isSeller = conv.seller_id === me;
  const myKind = isBuyer ? "buyer" : "seller"; const status = req.status; const split = splitAmount(Number(conv.agreed_price));
  const canChat = (isBuyer || isSeller) && !["completed", "cancelled"].includes(status) && !account?.profile?.blocked;

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => { setBusy(key); try { await fn(); if (ok) toast.success(ok); await qc.invalidateQueries({ queryKey: ["deal", id] }); } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); } };

  const send = async (file?: File) => {
    const senderId = account?.profile?.id;
    if (!senderId || busy || !canChat || (!file && !text.trim())) return;
    setBusy("send");
    try {
      let file_url: string | null = null;
      if (file) { if (file.size > 20 * 1024 * 1024) throw new Error("Files must be under 20 MB."); const path = `${id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`; const { error } = await supabase.storage.from("chat-files").upload(path, file); if (error) throw error; file_url = path; }
      const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: senderId, sender_kind: myKind, content: file ? text.trim() : text.trim(), file_url, file_name: file?.name ?? null });
      if (error) throw error;
      setText(""); await qc.invalidateQueries({ queryKey: ["deal", id] });
      if (isBuyer && agent.is_demo) { setBusy("agent"); await reply({ data: { conversationId: id } }); await qc.invalidateQueries({ queryKey: ["deal", id] }); }
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  };

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section className="flex h-[calc(100vh-90px)] flex-col overflow-hidden rounded-2xl border bg-card soft-shadow">
      <header className="flex items-center gap-3 border-b px-5 py-4"><SellerAvatar name={agent.name} demo={agent.is_demo} /><div className="min-w-0 flex-1"><p className="font-semibold">{isSeller ? "Buyer" : agent.name}</p><p className="truncate text-xs text-muted-foreground">{req.title}{agent.is_demo ? " · Demo seller replies via AI agent" : ""}</p></div><StatusBadge status={status} /></header>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">{msgs.map((m) => m.sender_kind === "system" ? <p key={m.id} className="text-center text-[11px] text-muted-foreground">{m.content}</p> : (() => { const mine = m.sender_kind === myKind && (m.sender_id === me); return <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}><div className={cn("max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary")}>{m.sender_kind === "agent" && <p className="mb-0.5 text-[10px] text-muted-foreground">AI agent · {agent.name}</p>}<Linkify text={m.content} />{m.file_url && <FileLink path={m.file_url} name={m.file_name ?? "File"} />}</div></div>; })())}
        {busy === "agent" && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />{agent.name} is typing…</div>}<div ref={endRef} /></div>
      {canChat && <div className="flex items-end gap-2 border-t p-3"><label className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Attach file"><Paperclip className="size-4" /><input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) send(f); }} /></label><textarea rows={1} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message…" className="intake-input max-h-32 flex-1 bg-transparent py-2 text-sm" /><Button size="icon" className="rounded-full" disabled={!!busy || !text.trim()} onClick={() => send()} aria-label="Send">{busy === "send" ? <Loader2 className="animate-spin" /> : <ArrowUp />}</Button></div>}
    </section>

    <aside className="space-y-4">
      <Card><p className="text-xs text-muted-foreground">Agreed price</p><p className="display mt-1 text-3xl font-semibold tabular-nums">{money(split.amount)}</p><div className="mt-4 space-y-1.5 border-t pt-4 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Platform commission</span><span>{money(split.platformFee)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Seller receives</span><span>{money(split.sellerAmount)}</span></div></div>
        {isSeller && status === "negotiating" && <div className="mt-4 flex gap-2"><Input type="number" min={1} placeholder="New price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="h-9" /><Button size="sm" variant="outline" disabled={!Number(newPrice) || !!busy} onClick={() => run("price", () => setPrice({ data: { conversationId: id, price: Number(newPrice) } }), "Price updated")}>Set</Button></div>}
      </Card>
      <Card><p className="mb-4 text-xs text-muted-foreground">Progress</p><Timeline requestStatus={status} txStatus={tx?.status ?? null} />{tx && <p className="mt-4 text-[11px] text-muted-foreground">PayPal order {tx.paypal_order_id} · <StatusBadge kind="tx" status={tx.status} /></p>}</Card>
      <Card>
        {status === "negotiating" && (isBuyer ? <><p className="text-sm">Happy with the terms?</p><Button asChild className="mt-4 w-full rounded-full"><Link to="/pay/$id" params={{ id }}><CreditCard />Proceed to Payment</Link></Button></> : <p className="text-sm text-muted-foreground">Waiting for the buyer to pay. You'll be notified here.</p>)}
        {status === "in_escrow" && (agent.is_demo ? (isBuyer ? <><p className="text-sm">Payment is held. This demo seller's AI agent can now prepare a demo delivery.</p><Button className="mt-4 w-full rounded-full" disabled={!!busy} onClick={() => run("deliver", () => deliver({ data: { conversationId: id } }), "Delivered")}>{busy === "deliver" ? <Loader2 className="animate-spin" /> : <PackageCheck />}Ask demo seller to deliver</Button></> : null)
          : isSeller ? <><p className="text-sm">Payment is held. Share your files in chat, then mark the work delivered.</p><textarea rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery note" className="mt-3 w-full rounded-lg border bg-background p-2.5 text-sm" /><Button className="mt-3 w-full rounded-full" disabled={note.trim().length < 5 || !!busy} onClick={() => run("deliver", () => deliver({ data: { conversationId: id, note } }), "Marked as delivered")}><PackageCheck />Mark as Delivered</Button></> : <p className="text-sm text-muted-foreground">Payment is held. Waiting for the seller to deliver.</p>)}
        {status === "delivered" && (isBuyer ? <><p className="text-sm">Review the delivery in the chat. {agent.is_demo ? "This demo seller receives no payout." : `Confirming schedules a manual seller payout of ${money(split.sellerAmount)}.`}</p><Button className="mt-4 w-full rounded-full" disabled={!!busy} onClick={() => run("confirm", () => confirm({ data: { conversationId: id } }), "Delivery confirmed")}>{busy === "confirm" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Confirm delivery</Button></> : <p className="text-sm text-muted-foreground">Delivered. Waiting for buyer confirmation.</p>)}
        {status === "completed" && <><p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-success" />Completed. {agent.is_demo ? "Demo transaction — no seller payout." : "Seller payout is processed manually."}</p><ReviewBox conversationId={id} isBuyer={isBuyer} sellerName={agent.name} /></>}
        {status === "cancelled" && <p className="text-sm text-muted-foreground">This request was cancelled{tx?.status === "refunded" ? " and the payment refunded" : ""}.</p>}
      </Card>
    </aside>
  </div>;
}
