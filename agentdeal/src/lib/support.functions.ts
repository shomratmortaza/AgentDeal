import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin() { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }
type Ctx = { supabase: any; userId: string };
async function isAdmin(ctx: Ctx) { const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }); return !!data; }
async function notBlocked(ctx: Ctx) { const { data } = await ctx.supabase.from("profiles").select("blocked").eq("id", ctx.userId).maybeSingle(); if (data?.blocked) throw new Error("Your account is blocked."); }

/* ---------- reviews ---------- */
export const submitReview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ conversationId: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000) }).parse(i))
  .handler(async ({ data, context }) => {
    await notBlocked(context);
    const { data: conv } = await context.supabase.from("conversations").select("id, buyer_id, agent_id, confirmed_at").eq("id", data.conversationId).maybeSingle();
    if (!conv || conv.buyer_id !== context.userId) throw new Error("Only the buyer of this deal can leave a review.");
    if (!conv.confirmed_at) throw new Error("You can review once you've confirmed the delivery.");
    const db = await admin();
    const { error } = await db.from("reviews").insert({ conversation_id: conv.id, agent_id: conv.agent_id, buyer_id: context.userId, rating: data.rating, comment: data.comment });
    if (error) throw new Error(error.code === "23505" ? "You've already reviewed this deal." : error.message);
    return { ok: true };
  });

/* ---------- support ---------- */
const categories = ["payment", "order", "account", "seller", "bug", "other"] as const;

export const createTicket = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ subject: z.string().trim().min(3).max(140), category: z.enum(categories), reference: z.string().trim().max(120), message: z.string().trim().min(10).max(4000) }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { count } = await db.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", context.userId).gte("created_at", new Date(Date.now() - 3600e3).toISOString());
    if ((count ?? 0) >= 5) throw new Error("You've opened several tickets in the last hour. Please reply in an existing one.");
    const { data: t, error } = await db.from("support_tickets").insert({ user_id: context.userId, subject: data.subject, category: data.category, reference: data.reference || null }).select("id").single();
    if (error) throw new Error(error.message);
    await db.from("support_messages").insert({ ticket_id: t.id, sender_id: context.userId, from_admin: false, content: data.message });
    return { id: t.id as string };
  });

export const replyTicket = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ ticketId: z.string().uuid(), content: z.string().trim().min(1).max(4000), close: z.boolean().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: t } = await context.supabase.from("support_tickets").select("id, user_id, status").eq("id", data.ticketId).maybeSingle();
    if (!t) throw new Error("Ticket not found.");
    const staff = await isAdmin(context);
    if (!staff && t.user_id !== context.userId) throw new Error("Not allowed.");
    const db = await admin();
    await db.from("support_messages").insert({ ticket_id: t.id, sender_id: context.userId, from_admin: staff && t.user_id !== context.userId, content: data.content });
    const status = data.close ? "closed" : staff && t.user_id !== context.userId ? "answered" : "open";
    await db.from("support_tickets").update({ status }).eq("id", t.id);
    return { ok: true };
  });

export const setTicketStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ ticketId: z.string().uuid(), status: z.enum(["open", "closed"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: t } = await context.supabase.from("support_tickets").select("id, user_id").eq("id", data.ticketId).maybeSingle();
    if (!t || (t.user_id !== context.userId && !(await isAdmin(context)))) throw new Error("Not allowed.");
    await (await admin()).from("support_tickets").update({ status: data.status }).eq("id", t.id);
    return { ok: true };
  });

/** Admin inbox: tickets with the requester's name/email (admins only). */
export const adminTickets = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  if (!(await isAdmin(context))) throw new Error("Admins only.");
  const { data: tickets } = await context.supabase.from("support_tickets").select("*").order("updated_at", { ascending: false }).limit(500);
  const ids = Array.from(new Set((tickets ?? []).map((t: { user_id: string }) => t.user_id)));
  const { data: people } = ids.length ? await context.supabase.from("profiles").select("id, name, email").in("id", ids) : { data: [] };
  return (tickets ?? []).map((t: Record<string, unknown>) => ({ ...t, person: (people ?? []).find((p: { id: string }) => p.id === t["user_id"]) ?? null })) as Array<{ id: string; user_id: string; subject: string; category: string; reference: string | null; status: string; created_at: string; updated_at: string; person: { name: string | null; email: string | null } | null }>;
});
