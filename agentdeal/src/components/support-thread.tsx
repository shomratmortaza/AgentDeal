import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { replyTicket, setTicketStatus } from "@/lib/support.functions";
import { Linkify } from "@/components/linkify";
import { cn } from "@/lib/utils";

export const ticketCategories = [
  { v: "payment", l: "Payment or refund" }, { v: "order", l: "Order or delivery" }, { v: "account", l: "Account and login" },
  { v: "seller", l: "Problem with a seller or buyer" }, { v: "bug", l: "Something isn't working" }, { v: "other", l: "Other" },
] as const;
export const statusTone: Record<string, string> = { open: "bg-signal/15 text-signal", answered: "bg-success/15 text-success", closed: "bg-secondary text-muted-foreground" };

export function SupportThread({ ticket, staff, onChanged }: { ticket: { id: string; subject: string; status: string; category: string; reference: string | null; created_at: string }; staff: boolean; onChanged: () => void }) {
  const qc = useQueryClient(); const reply = useServerFn(replyTicket); const setStatus = useServerFn(setTicketStatus);
  const key = ["support-messages", ticket.id];
  const { data: msgs, isLoading } = useQuery({ queryKey: key, queryFn: async () => (await supabase.from("support_messages").select("*").eq("ticket_id", ticket.id).order("created_at")).data ?? [] });
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const send = async (close = false) => {
    if (!text.trim()) return; setBusy(true);
    try { await reply({ data: { ticketId: ticket.id, content: text, close } }); setText(""); await qc.invalidateQueries({ queryKey: key }); onChanged(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const toggle = async () => { try { await setStatus({ data: { ticketId: ticket.id, status: ticket.status === "closed" ? "open" : "closed" } }); onChanged(); } catch (e) { toast.error((e as Error).message); } };
  const cat = ticketCategories.find((c) => c.v === ticket.category)?.l ?? ticket.category;
  return <div className="flex h-full flex-col">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div><h2 className="text-lg font-semibold">{ticket.subject}</h2><p className="mt-1 text-xs text-muted-foreground">{cat}{ticket.reference ? ` · Ref: ${ticket.reference}` : ""} · Opened {new Date(ticket.created_at).toLocaleString()}</p></div>
      <div className="flex items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium capitalize", statusTone[ticket.status])}>{ticket.status}</span><Button size="sm" variant="outline" onClick={toggle}>{ticket.status === "closed" ? "Reopen" : "Mark resolved"}</Button></div>
    </div>
    <div className="flex-1 space-y-3 overflow-y-auto py-4">
      {isLoading ? <Loader2 className="mx-auto animate-spin text-muted-foreground" /> : msgs?.map((m) => {
        const mine = staff ? m.from_admin : !m.from_admin;
        return <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", mine ? "ml-auto bg-signal/15" : "bg-card border")}>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">{m.from_admin && <ShieldCheck className="size-3.5 text-signal" />}{m.from_admin ? "AgentDeal Support" : staff ? "Customer" : "You"} · {new Date(m.created_at).toLocaleString()}</p>
          <p className="whitespace-pre-wrap break-words"><Linkify text={m.content} /></p>
        </div>;
      })}
    </div>
    <div className="space-y-2 border-t pt-4">
      <textarea rows={3} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder={staff ? "Reply to the customer…" : "Add more details or reply to support…"} aria-label="Reply" className="w-full rounded-md border bg-background p-3 text-sm" />
      <div className="flex justify-end gap-2">{staff && <Button variant="outline" disabled={busy || !text.trim()} onClick={() => send(true)}>Reply and resolve</Button>}<Button disabled={busy || !text.trim()} onClick={() => send(false)}>{busy && <Loader2 className="animate-spin" />}Send reply</Button></div>
    </div>
  </div>;
}
