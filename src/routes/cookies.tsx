import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { readConsent, saveConsent } from "@/components/cookie-banner";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/cookies")({ head: () => pageHead("Cookie policy", "Which cookies and local storage AgentDeal uses, why, and how to change your choice."), component: Cookies });

const rows = [
  { name: "Sign-in session", kind: "Essential", why: "Keeps you signed in and lets the site confirm who you are on every request.", life: "Until you sign out" },
  { name: "Payment checkout (PayPal)", kind: "Essential", why: "Set by PayPal while you pay, to process the payment and prevent fraud.", life: "Set by PayPal" },
  { name: "Theme and cookie choice", kind: "Essential", why: "Remembers light or dark mode and the choice you make on this page.", life: "Until cleared" },
  { name: "Listing visit counter", kind: "Analytics", why: "A random ID so a seller's profile views are counted once per visitor. Contains no personal details.", life: "Until cleared" },
];

function Cookies() {
  const [analytics, setAnalytics] = useState(false); const [decided, setDecided] = useState<string | null>(null);
  useEffect(() => { const c = readConsent(); setAnalytics(!!c?.analytics); setDecided(c?.decidedAt ?? null); }, []);
  return <div className="min-h-screen bg-background"><PublicHeader />
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-12">
      <h1 className="display text-4xl font-semibold">Cookie policy</h1>
      <p className="mt-4 text-muted-foreground">AgentDeal uses a small number of cookies and browser storage items. Essential ones are needed for sign-in and payments and can't be switched off. Analytics is optional.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-4 font-normal">What</th><th className="p-4 font-normal">Type</th><th className="p-4 font-normal">Why</th><th className="p-4 font-normal">How long</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.name} className="border-b last:border-0 align-top"><td className="p-4 font-medium">{r.name}</td><td className="p-4">{r.kind}</td><td className="p-4 text-muted-foreground">{r.why}</td><td className="p-4 text-muted-foreground">{r.life}</td></tr>)}</tbody></table></div>
      <section className="mt-10 rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Your choice</h2>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm"><span>Essential<span className="block text-xs text-muted-foreground">Always on</span></span><Switch checked disabled aria-label="Essential cookies" /></label>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm"><span>Analytics<span className="block text-xs text-muted-foreground">Anonymous listing visit counts</span></span><Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" /></label>
        <div className="mt-6 flex items-center justify-between gap-4"><p className="text-xs text-muted-foreground">{decided ? `Last saved ${new Date(decided).toLocaleString()}` : "You haven't chosen yet."}</p>
          <Button onClick={() => { const c = saveConsent(analytics); setDecided(c.decidedAt); if (!analytics) localStorage.removeItem("ad_visitor"); toast.success("Cookie preferences saved"); }}>Save preferences</Button></div>
      </section>
      <p className="mt-8 text-sm text-muted-foreground">Questions? Signed-in users can reach us through <Link to="/support" className="text-foreground underline underline-offset-4">Help & support</Link>.</p>
    </main></div>;
}
