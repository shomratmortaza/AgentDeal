import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Plus, Loader2, ShieldCheck, Clock3, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { createTicket } from "@/lib/support.functions";
import { useAccount } from "@/hooks/use-account";
import { Card, Empty, PageHeader } from "@/components/bits";
import { SupportThread, statusTone, ticketCategories } from "@/components/support-thread";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/support")({ head: () => pageHead("Help & support", "Contact the AgentDeal team about payments, orders, accounts or anything else."), component: Support });

function Support() {
  const { data: account } = useAccount(); const qc = useQueryClient(); const create = useServerFn(createTicket);
  const { data: tickets, isLoading } = useQuery({ queryKey: ["my-tickets"], enabled: !!account, queryFn: async () => (await supabase.from("support_tickets").select("*").eq("user_id", account!.profile!.id).order("updated_at", { ascending: false })).data ?? [] });
  const [sel, setSel] = useState<string | null>(null); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ subject: "", category: "payment" as (typeof ticketCategories)[number]["v"], reference: "", message: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-tickets"] });
  const current = tickets?.find((t) => t.id === sel) ?? tickets?.[0];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.subject.trim().length < 3 || f.message.trim().length < 10) { toast.error("Add a subject and at least a sentence describing the issue."); return; }
    setBusy(true);
    try { const t = await create({ data: f }); await refresh(); setSel(t.id); setOpen(false); setF({ subject: "", category: "payment", reference: "", message: "" }); toast.success("Ticket sent. Our team will reply here."); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  return <>
    <PageHeader title="Help & support" subtitle="Problems with a payment, an order or another user? Talk to the AgentDeal team directly." action={<Button onClick={() => setOpen(true)}><Plus />New ticket</Button>} />
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {[{ i: ShieldCheck, t: "Payments are protected", d: "Funds stay held until the buyer approves delivery. Open a ticket before confirming if something's wrong." }, { i: Clock3, t: "We reply here", d: "Answers appear in your ticket. Keep everything in one thread so nothing gets lost." }, { i: Mail, t: "Include references", d: "Add the deal or payment ID so we can look into it straight away." }].map((x) =>
        <Card key={x.t} className="p-4"><x.i className="size-5 text-signal" /><p className="mt-2 text-sm font-semibold">{x.t}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{x.d}</p></Card>)}
    </div>
    {isLoading ? <Loader2 className="animate-spin text-muted-foreground" /> : !tickets?.length ? <Empty icon={LifeBuoy} title="No tickets yet" text="When you contact support, your conversation with the team shows up here." /> :
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="space-y-1 p-2">{tickets.map((t) => <button key={t.id} onClick={() => setSel(t.id)} className={cn("w-full rounded-xl p-3 text-left transition-colors hover:bg-secondary", current?.id === t.id && "bg-secondary")}>
          <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{t.subject}</p><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize", statusTone[t.status])}>{t.status}</span></div>
          <p className="mt-1 text-[11px] text-muted-foreground">Updated {new Date(t.updated_at).toLocaleDateString()}</p></button>)}</Card>
        {current && <Card className="min-h-[480px]"><SupportThread key={current.id} ticket={current} staff={false} onChanged={refresh} /></Card>}
      </div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Contact support</DialogTitle><DialogDescription>Tell us what happened. An admin will reply in this ticket.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">Topic<select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as typeof f.category })} className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm">{ticketCategories.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</select></label>
        <label className="block text-sm font-medium">Subject<Input className="mt-2" maxLength={140} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="e.g. Payment taken but deal still shows unpaid" /></label>
        <label className="block text-sm font-medium">Deal or payment reference <span className="font-normal text-muted-foreground">(optional)</span><Input className="mt-2" maxLength={120} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="Paste the deal link or PayPal order ID" /></label>
        <label className="block text-sm font-medium">What happened?<textarea rows={5} maxLength={4000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" /></label>
        <Button className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Send to support</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}
