import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FileText, Scale, MessagesSquare, ShieldCheck, Receipt, Paperclip, Star, Clock, BadgeCheck, BookOpen, Inbox, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/head";
import { PublicHeader, useSignedIn } from "@/components/public-header";
import { Wordmark } from "@/components/logo";

export const Route = createFileRoute("/")({
  head: () => pageHead("Hire experts or sell your craft", "Buyers describe the job and get three ranked sellers with written reasons. Sellers get matched with real briefs. Payments are held until delivery is approved."),
  component: Landing,
});

const MATCHES = [
  { n: "MotionLab", tag: "Motion design", s: 92, p: "$95", d: "3 days", r: "4.9", why: "Under budget, fastest delivery, strongest motion portfolio match." },
  { n: "Frame & Co", tag: "Video editing", s: 86, p: "$120", d: "4 days", r: "4.8", why: "Excellent rating; slightly higher price for the same scope." },
  { n: "Northcut Studio", tag: "Brand film", s: 79, p: "$140", d: "5 days", r: "4.7", why: "Strong craft, but close to your budget ceiling." },
];
const WEIGHTS = [["Price fit", 35], ["Delivery speed", 30], ["Rating", 20], ["Skill match", 10], ["Offer quality", 5]] as const;

function Landing() {
  const signedIn = useSignedIn();
  const start = signedIn ? { to: "/new" as const } : { to: "/auth" as const, search: { mode: "register" } };
  const sell = signedIn ? { to: "/listing" as const } : { to: "/auth" as const, search: { mode: "register" } };
  return <div className="relative min-h-screen bg-background">
    <div className="ambient" aria-hidden />
    <div className="relative z-10">
      <PublicHeader />

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pb-14 pt-24 text-center md:pt-32">
        <p className="rise inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 backdrop-blur-xl elev-1">
          <span className="pulse-dot size-1.5 rounded-full bg-success shadow-[0_0_10px_oklch(0.72_0.17_160/0.9)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/80">Payments held until delivery is approved</span>
        </p>
        <h1 className="display rise mx-auto mt-8 max-w-5xl text-balance text-[clamp(2.9rem,7vw,6rem)]" style={{ animationDelay: ".06s" }}>
          Hire the right expert.<br /><span className="text-gradient">Or become one.</span>
        </h1>
        <p className="rise mx-auto mt-7 max-w-2xl text-[18px] leading-[1.6] text-muted-foreground" style={{ animationDelay: ".12s" }}>
          Buyers describe the job in their own words and get three ranked sellers, each with a written reason. Sellers get matched with real briefs, agree terms in private chat, and get paid once delivery is approved.
        </p>
        <div className="rise mt-10 flex flex-wrap justify-center gap-4" style={{ animationDelay: ".18s" }}>
          <Button asChild size="lg"><Link {...(start as any)}>Post a request</Link></Button>
          <Button asChild size="lg" variant="outline"><Link {...(sell as any)}>Sell your skills</Link></Button>
        </div>
      </section>

      {/* Product showcase */}
      <section className="mx-auto max-w-[1200px] px-6 pb-32">
        <div className="rise floaty overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/80 p-3 backdrop-blur-2xl elev-3 md:p-4" style={{ animationDelay: ".26s" }}>
          <div className="grid gap-3 md:grid-cols-[1fr_1.35fr] md:gap-4">
            {/* Brief */}
            <div className="rounded-[1.8rem] border border-white/[0.07] bg-white/[0.02] p-7">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"><FileText className="size-4 text-muted-foreground" /></span>
                <span className="eyebrow">Your request</span>
              </div>
              <p className="mt-5 rounded-3xl rounded-tl-lg border border-white/[0.07] bg-white/[0.04] px-5 py-4 text-[15px] italic leading-relaxed text-foreground/90">"I need a 30-second promo video for my cafe. Budget around $150, ready within a week."</p>
              <div className="mt-7 flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="eyebrow">Brief prepared by AI</span>
                <span className="mono rounded bg-signal/15 px-2 py-0.5 text-[10px] font-bold text-signal">READY</span>
              </div>
              <dl className="mt-2 divide-y divide-white/[0.05] text-[14px]">
                {[["Service", "Promotional video"], ["Budget", "Up to $150"], ["Deadline", "7 days"], ["Skills", "Video editing, motion graphics"]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
              </dl>
              <p className="mt-4 text-[11px] uppercase tracking-tight text-muted-foreground/70">Example data. Sellers shown are labeled demo profiles.</p>
            </div>
            {/* Matches */}
            <div className="rounded-[1.8rem] border border-white/[0.07] bg-white/[0.02] p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl border border-signal/25 bg-signal/10"><Scale className="size-4 text-signal" /></span>
                  <span className="eyebrow">Top 3 matches</span>
                </div>
                <span className="mono rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase text-muted-foreground">Ranked 0–100</span>
              </div>
              <ul className="mt-6 space-y-3">
                {MATCHES.map((m, i) => <li key={m.n} className={`relative rounded-3xl border p-5 transition-all duration-300 ${i === 0 ? "border-signal/40 bg-signal/[0.07] shadow-[0_20px_50px_-12px_oklch(0.6_0.21_278/0.35)]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"}`}>
                  {i === 0 && <span className="absolute -top-2.5 left-6 rounded-full bg-signal px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-signal-foreground shadow-[0_10px_24px_oklch(0.6_0.21_278/0.5)]">Best match</span>}
                  <div className="flex items-center gap-4">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-black ${i === 0 ? "border border-white/25 bg-gradient-to-br from-signal to-signal/60 text-signal-foreground shadow-lg" : "border border-white/10 bg-white/[0.06] text-muted-foreground"}`}>{m.n.split(/\s|&/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="truncate font-bold">{m.n}</span><span className="mono rounded border border-white/10 bg-white/[0.04] px-1.5 py-px text-[9px] uppercase text-muted-foreground">Demo</span></div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-muted-foreground"><span>{m.tag}</span><span className="inline-flex items-center gap-1"><Star className="size-3 fill-success text-success" />{m.r}</span><span className="inline-flex items-center gap-1"><Clock className="size-3" />{m.d}</span></div>
                    </div>
                    <div className="text-right"><div className="mono text-[17px] font-bold tabular-nums">{m.p}</div></div>
                    <div className={`ml-1 flex size-13 shrink-0 flex-col items-center justify-center rounded-2xl tabular-nums ${i === 0 ? "border border-white/25 bg-signal text-signal-foreground shadow-[0_10px_28px_oklch(0.6_0.21_278/0.45)]" : "border border-white/10 bg-white/[0.04]"}`}><span className="mono text-[17px] font-bold leading-none">{m.s}</span><span className="mt-0.5 text-[8px] uppercase opacity-70">score</span></div>
                  </div>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className={`bar h-full rounded-full ${i === 0 ? "bg-signal shadow-[0_0_12px_oklch(0.6_0.21_278/0.8)]" : "bg-foreground/30"}`} style={{ width: `${m.s}%`, animationDelay: `${0.5 + i * 0.15}s` }} /></div>
                  <p className="mt-3 text-[13px] leading-snug text-muted-foreground">{m.why}</p>
                </li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="rise mt-3 flex flex-wrap items-center gap-x-7 gap-y-3 rounded-[1.8rem] border border-white/[0.07] bg-white/[0.02] px-7 py-5 backdrop-blur-2xl" style={{ animationDelay: ".34s" }}>
          <span className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"><Inbox className="size-4 text-muted-foreground" /></span>
            <span className="eyebrow">The seller's view</span>
          </span>
          <p className="text-[14px] leading-snug text-muted-foreground"><span className="font-semibold text-foreground">New match</span> — "30-second cafe promotional video" · your score <span className="mono font-bold text-foreground">94</span> · buyer budget up to <span className="mono font-bold text-foreground">$150</span></p>
          <span className="mono shrink-0 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase text-muted-foreground">Example · Demo</span>
        </div>
      </section>

      {/* Feature bento */}
      <section id="how" className="border-t border-white/[0.06] py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <p className="eyebrow text-center text-signal">How it works</p>
          <h2 className="display mx-auto mt-4 max-w-3xl text-balance text-center text-[clamp(2.2rem,4.6vw,3.8rem)]">One deal. Both sides of it.</h2>
          <p className="eyebrow mt-16 text-foreground/70">For buyers</p>
          <div className="mt-4 grid gap-4 md:grid-cols-6">
            <Tile className="md:col-span-4" icon={FileText} step="1" title="Describe it like you'd text a friend" body="No forms. AI pulls out the budget, deadline and skills, and you confirm the brief before anything goes out.">
              <div className="mt-8 flex flex-wrap gap-2">{["Promotional video", "≤ $150", "7 days", "Motion graphics"].map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px]">{t}</span>)}</div>
            </Tile>
            <Tile className="md:col-span-2" icon={Scale} step="2" title="A score you can read" body="Every match is ranked on five published weights.">
              <ul className="mt-6 space-y-2.5">{WEIGHTS.map(([k, w]) => <li key={k} className="text-[13px]"><div className="flex justify-between"><span>{k}</span><span className="mono tabular-nums text-muted-foreground">{w}%</span></div><div className="mt-1 h-1 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-signal/80" style={{ width: `${w / 0.35}%` }} /></div></li>)}</ul>
            </Tile>
            <Tile className="md:col-span-3" icon={MessagesSquare} step="3" title="You choose. Then talk it through." body="Nothing is auto-hired. Agree on scope and price in a private chat, with files and references.">
              <div className="mt-7 space-y-2 text-[14px]">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.05] px-4 py-2.5">Can you include our logo animation at the end?</div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-signal px-4 py-2.5 text-signal-foreground shadow-[0_10px_28px_-8px_oklch(0.6_0.21_278/0.5)]">Yes — included at $95. Draft in 3 days.</div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px]"><Paperclip className="size-3.5 text-muted-foreground" />cafe-brand-kit.pdf</div>
              </div>
            </Tile>
            <Tile className="md:col-span-3" icon={ShieldCheck} step="4" title="Pay once. Release when happy." body="Pay through PayPal. The deal shows as Held until you confirm delivery — then the seller is paid.">
              <ol className="mt-7 flex items-center gap-2 text-[13px]">
                {["Paid", "Held", "Delivered", "Completed"].map((s, i) => <li key={s} className="flex flex-1 flex-col items-center gap-2"><span className={`flex size-8 items-center justify-center rounded-full text-[12px] font-bold ${i < 3 ? "border border-white/15 bg-white/[0.06]" : "bg-success text-background shadow-[0_0_18px_oklch(0.72_0.17_160/0.5)]"}`}>{i === 3 ? <BadgeCheck className="size-4" /> : i + 1}</span><span className="text-muted-foreground">{s}</span></li>)}
              </ol>
            </Tile>
          </div>

          <p className="eyebrow mt-14 text-foreground/70">For sellers</p>
          <div className="mt-4 grid gap-4 md:grid-cols-6">
              <Tile className="md:col-span-4" icon={BookOpen} step="1" title="Publish what you do" body="List your service, skills, starting price and delivery time. That listing is exactly what the AI matches buyers against.">
                <div className="mt-8 flex flex-wrap gap-2">{["Motion design", "From $95", "3-day delivery", "Open to offers"].map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px]">{t}</span>)}</div>
              </Tile>
              <Tile className="md:col-span-2" icon={Scale} step="2" title="Matched on real numbers" body="When a brief fits, you land in the buyer's top three — ranked on the same five published weights.">
                <div className="mt-6 flex items-baseline gap-2"><span className="mono text-[34px] font-bold leading-none tabular-nums">92</span><span className="text-[12px] uppercase tracking-tight text-muted-foreground">score in a matching brief</span></div>
              </Tile>
              <Tile className="md:col-span-3" icon={MessagesSquare} step="3" title="See the brief before you commit" body="Every request arrives as a structured brief. Discuss scope, files and price with the buyer before accepting.">
                <div className="mt-7 space-y-2 text-[14px]">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.05] px-4 py-2.5">Can you start Thursday and include our logo animation?</div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-signal px-4 py-2.5 text-signal-foreground shadow-[0_10px_28px_-8px_oklch(0.6_0.21_278/0.5)]">Thursday works — $95 all in, draft in 3 days.</div>
                </div>
              </Tile>
              <Tile className="md:col-span-3" icon={Wallet} step="4" title="Paid once delivery is approved" body="The buyer's payment is held while you work. When they confirm delivery, your earnings are queued for payout.">
                <ol className="mt-7 flex items-center gap-2 text-[13px]">
                  {["Paid", "Held", "Delivered", "Completed"].map((s, i) => <li key={s} className="flex flex-1 flex-col items-center gap-2"><span className={`flex size-8 items-center justify-center rounded-full text-[12px] font-bold ${i === 1 ? "border border-white/25 bg-signal text-signal-foreground shadow-[0_10px_28px_oklch(0.6_0.21_278/0.4)]" : i === 3 ? "bg-success text-background shadow-[0_0_18px_oklch(0.72_0.17_160/0.5)]" : "border border-white/15 bg-white/[0.06]"}`}>{s === "Completed" ? <BadgeCheck className="size-4" /> : i + 1}</span><span className={i === 1 ? "font-medium text-foreground" : "text-muted-foreground"}>{s}</span></li>)}
                </ol>
              </Tile>
            </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/[0.06] py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 md:grid-cols-2">
          <div>
            <p className="eyebrow text-signal">Pricing</p>
            <h2 className="display mt-4 text-[clamp(2.2rem,4.6vw,3.8rem)]">One fee. Shown before you pay.</h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted-foreground">Joining is free on both sides — posting a request and offering your services cost nothing. A single 7% commission applies to each completed deal, shown in full before any payment is made.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-card/80 p-8 backdrop-blur-xl elev-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"><Receipt className="size-4 text-muted-foreground" /></span>
              <span className="eyebrow">Example checkout</span>
            </div>
            <dl className="mt-6 space-y-4 text-[15px]">
              <Row k="Service amount" v="$95.00" />
              <Row k="Platform commission" v="$6.65" muted />
              <div className="border-t border-white/[0.08] pt-4"><Row k="Total payable" v="$95.00" bold /></div>
            </dl>
            <p className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[13px] text-muted-foreground">Payments currently run in PayPal test mode. Seller payouts are released manually by the platform.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-28">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] border border-signal/30 bg-gradient-to-b from-signal/25 via-card to-card px-8 py-24 text-center elev-3">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-signal/25 blur-[110px]" />
          <h2 className="display relative mx-auto max-w-2xl text-balance text-[clamp(2.2rem,4.6vw,3.8rem)]">Your next project — or your next client — starts with one sentence.</h2>
          <div className="relative mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg"><Link {...(start as any)}>Post a request</Link></Button>
            <Button asChild size="lg" variant="outline"><Link {...(sell as any)}>Sell your skills</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-4"><Wordmark className="w-[96px] opacity-80" /><span>© 2026</span></div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><Link to="/cookies" className="hover:text-foreground">Cookie policy</Link><Link to={signedIn ? "/support" : "/auth"} className="hover:text-foreground">Help & support</Link><span>Demo sellers are labeled and answered by AI agents · PayPal test mode</span></div>
        </div>
      </footer>
    </div>
  </div>;
}

function Tile({ className = "", icon: Icon, step, title, body, children }: { className?: string; icon: typeof FileText; step: string; title: string; body: string; children?: ReactNode }) {
  return <div className={`lift rounded-[1.8rem] border border-white/[0.08] bg-card/70 p-7 backdrop-blur-xl md:p-8 ${className}`}>
    <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-signal/25 bg-signal/10 text-signal"><Icon className="size-[18px]" /></span><span className="eyebrow">Step {step}</span></div>
    <h3 className="mt-5 text-[22px] font-bold leading-tight">{title}</h3>
    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
    {children}
  </div>;
}

function Row({ k, v, muted, bold }: { k: string; v: string; muted?: boolean; bold?: boolean }) {
  return <div className="flex justify-between"><dt className={muted ? "text-muted-foreground" : ""}>{k}</dt><dd className={`mono tabular-nums ${bold ? "text-[20px] font-bold" : ""} ${muted ? "text-muted-foreground" : ""}`}>{v}</dd></div>;
}
