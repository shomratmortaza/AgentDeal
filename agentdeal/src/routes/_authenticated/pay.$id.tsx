import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { createOrder, captureOrder, getPaypalClientId } from "@/lib/market.functions";
import { money, splitAmount } from "@/lib/market";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/pay/$id")({ head: () => pageHead("Payment", "Pay securely with PayPal. Review your service amount and the included platform commission."), component: Pay });

declare global { interface Window { paypal?: any } }

function loadSdk(clientId: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.paypal) return resolve();
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    s.onload = () => resolve(); s.onerror = () => reject(new Error("PayPal could not load. Check your connection."));
    document.head.appendChild(s);
  });
}

function Pay() {
  const { id } = Route.useParams(); const navigate = useNavigate();
  const create = useServerFn(createOrder); const capture = useServerFn(captureOrder); const cfg = useServerFn(getPaypalClientId);
  const ref = useRef<HTMLDivElement>(null); const [state, setState] = useState<"loading" | "ready" | "capturing" | "error">("loading"); const [err, setErr] = useState("");
  const q = useQuery({ queryKey: ["pay", id], queryFn: async () => { const { data, error } = await supabase.from("conversations").select("*, provider_agents(name,is_demo), service_requests(title,status)").eq("id", id).single(); if (error) throw error; return data; } });

  useEffect(() => {
    if (!q.data || q.data.service_requests?.status !== "negotiating" || !ref.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { clientId } = await cfg(); if (!clientId) throw new Error("PayPal is not configured.");
        await loadSdk(clientId); if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        await window.paypal.Buttons({
          style: { shape: "rect", color: "blue", label: "pay", height: 52 },
          createOrder: async () => (await create({ data: { conversationId: id } })).orderId,
          onApprove: async (d: { orderID: string }) => { setState("capturing"); try { const r = await capture({ data: { orderId: d.orderID } }); if (r.status === "held") { toast.success("Payment confirmed and held"); navigate({ to: "/deals/$id", params: { id } }); } } catch (e) { toast.error((e as Error).message); setState("ready"); } },
          onCancel: () => toast("Payment cancelled"),
          onError: (e: Error) => {
            if (/popup.*close/i.test(e?.message ?? "")) return;
            toast.error(e?.message ?? "PayPal could not start checkout. Please try again.");
          },
        }).render(ref.current);
        setState("ready");
      } catch (e) { setErr((e as Error).message); setState("error"); }
    })();
    return () => { cancelled = true; };
  }, [q.data, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (q.isLoading) return <div className="mx-auto max-w-md space-y-4"><Skeleton className="h-10 w-40" /><Skeleton className="h-96 rounded-2xl" /></div>;
  if (!q.data) return <p className="text-destructive">Deal not found.</p>;
  const c = q.data; const s = splitAmount(Number(c.agreed_price));
  return <div className="ledger-checkout relative min-w-0 pb-8">
    <Button asChild variant="ghost" size="sm" className="mb-8 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
      <Link to="/deals/$id" params={{ id }}><ArrowLeft />Back</Link>
    </Button>
    <section aria-labelledby="payment-title" className="ledger-receipt mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
      <header className="px-6 pt-10 sm:px-8">
        <h1 id="payment-title" className="text-2xl font-bold">Payment</h1>
        <p className="mt-1 border-b border-border/60 pb-6 text-sm leading-6 text-muted-foreground break-words">{c.service_requests?.title} · {c.provider_agents?.name}{c.provider_agents?.is_demo ? " (demo seller)" : ""}</p>
      </header>
      <div className="p-6 sm:p-8">
        <dl className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Service amount</dt><dd className="ledger-amount shrink-0 rounded border border-border/60 bg-muted/50 px-2 py-0.5 font-medium">{money(s.amount)}</dd></div>
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-5"><dt className="text-muted-foreground">Platform commission</dt><dd className="ledger-amount shrink-0 rounded border border-border/60 bg-muted/50 px-2 py-0.5 font-medium">{money(s.platformFee)}</dd></div>
          <div className="flex items-end justify-between gap-4 pt-3"><dt><span className="block text-lg font-bold">Total payable</span><span className="text-xs text-muted-foreground">Includes the platform commission</span></dt><dd className="ledger-amount shrink-0 text-2xl font-bold">{money(s.amount)}</dd></div>
        </dl>
        <div className="mt-8 flex gap-3 rounded-xl border border-checkout-info-border bg-checkout-info p-4 text-checkout-info-foreground">
          <Info className="mt-0.5 size-5 shrink-0" />
          <p className="text-xs leading-5">PayPal test payment. The platform commission is included in your total. Held is an AgentDeal tracking status, not PayPal escrow. Seller payouts are manual; demo sellers receive no payout.</p>
        </div>
        <div className="mt-8" aria-live="polite">
          {c.service_requests?.status !== "negotiating" ? <p className="text-sm text-muted-foreground">This deal has already been paid.</p> :
            <>{state === "loading" && <Skeleton className="h-14 rounded-lg" />}{state === "capturing" && <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />Confirming with PayPal…</p>}{state === "error" && <p role="alert" className="text-sm text-destructive">{err}</p>}<div ref={ref} className={state === "capturing" ? "hidden" : ""} /></>}
        </div>
      </div>
    </section>
  </div>;
}
