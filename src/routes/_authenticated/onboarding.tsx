import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ShoppingBag, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chooseRole } from "@/lib/market.functions";
import { useAccount } from "@/hooks/use-account";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({ head: () => pageHead("Choose your role", "Choose whether you buy or sell services on AgentDeal."), component: Onboarding });

function Onboarding() {
  const { data } = useAccount(); const navigate = useNavigate(); const qc = useQueryClient(); const fn = useServerFn(chooseRole);
  const [role, setRole] = useState<"buyer" | "seller" | null>(null); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data?.role) navigate({ to: "/dashboard", replace: true }); if (data?.profile?.name && !name) setName(data.profile.name); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const opts = [{ v: "buyer" as const, icon: ShoppingBag, t: "I want to buy services", d: "Describe what you need. AI ranks sellers for you." }, { v: "seller" as const, icon: Briefcase, t: "I want to sell services", d: "Publish a listing and get matched with buyers." }];
  return <div className="flex min-h-screen items-center justify-center px-6 py-16"><div className="w-full max-w-xl">
    <h1 className="display text-center text-4xl font-semibold">How will you use AgentDeal?</h1>
    <p className="mt-3 text-center text-muted-foreground">This choice is permanent for your account.</p>
    <div className="mt-12 grid gap-4 sm:grid-cols-2">{opts.map((o) => <button key={o.v} onClick={() => setRole(o.v)} className={cn("rounded-2xl border bg-card p-6 text-left transition-all soft-shadow", role === o.v ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20")}><o.icon className="size-5 text-primary" /><p className="mt-6 font-semibold">{o.t}</p><p className="mt-1 text-sm text-muted-foreground">{o.d}</p></button>)}</div>
    <label className="mt-8 block text-sm font-medium">Your name<Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-2 h-11 rounded-xl" placeholder="Jane Appleseed" /></label>
    <Button className="mt-8 h-11 w-full rounded-xl" disabled={!role || name.trim().length < 2 || busy} onClick={async () => { if (!role) return; setBusy(true); try { await fn({ data: { role, name } }); await qc.invalidateQueries({ queryKey: ["account"] }); toast.success("You're all set"); navigate({ to: role === "seller" ? "/listing" : "/dashboard", replace: true }); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }}>{busy ? "Saving…" : "Continue"}</Button>
  </div></div>;
}
