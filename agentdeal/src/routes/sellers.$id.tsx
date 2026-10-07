import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, MessageCircle, Globe, Briefcase, MapPin, Linkedin, Github, Instagram, Twitter, FolderOpen, Loader2, ArrowLeft, PenTool, Palette, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSellerPage, openThread, trackListing } from "@/lib/dm.functions";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";
import { RatingBadge, Stars } from "@/components/rating";
import { readConsent } from "@/components/cookie-banner";
import { PublicHeader, Avatar, useSignedIn } from "@/components/public-header";

export const Route = createFileRoute("/sellers/$id")({
  loader: async ({ params }) => { const d = await getSellerPage({ data: { id: params.id } }); if (!d) throw notFound(); return d; },
  head: ({ loaderData, params }) => {
    const base = pageHead(loaderData ? `${loaderData.agent.name} — Seller` : "Seller", loaderData ? `${loaderData.agent.category} seller on AgentDeal. ${loaderData.agent.description}`.slice(0, 155) : "Seller profile on AgentDeal.");
    const a = loaderData?.agent;
    if (!a || a.is_demo) return base;
    // Only real reviews from real buyers are published as ratings; demo listings never get markup.
    const ld: Record<string, unknown> = { "@context": "https://schema.org", "@type": "Service", name: a.name, description: a.description, serviceType: a.category, url: `/sellers/${params.id}`,
      offers: { "@type": "Offer", price: Number(a.base_price).toFixed(2), priceCurrency: "USD" } };
    if (a.review_count > 0) ld["aggregateRating"] = { "@type": "AggregateRating", ratingValue: Number(a.rating), reviewCount: a.review_count, bestRating: 5, worstRating: 1 };
    return { ...base, scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }] };
  },
  errorComponent: () => <div className="p-16 text-center text-muted-foreground">This seller couldn't be loaded. <Link to="/sellers" className="text-primary">Back to sellers</Link></div>,
  notFoundComponent: () => <div className="p-16 text-center text-muted-foreground">This seller isn't available. <Link to="/sellers" className="text-primary">Back to sellers</Link></div>,
  component: Seller,
});

function Seller() {
  const { agent: a, owner: o, completed, reviews } = Route.useLoaderData();
  const signedIn = useSignedIn(); const navigate = useNavigate(); const open = useServerFn(openThread);
  const [busy, setBusy] = useState(false);
  const trackFn = useServerFn(trackListing);
  const track = (kind: "view" | "contact" | "link") => {
    try {
      let v = localStorage.getItem("ad_visitor");
      if (!v && !readConsent()?.analytics) v = `s-${sessionStorage.getItem("ad_s") ?? (() => { const x = crypto.randomUUID(); sessionStorage.setItem("ad_s", x); return x; })()}`;
      if (!v) { v = crypto.randomUUID(); localStorage.setItem("ad_visitor", v); }
      void trackFn({ data: { agentId: a.id, kind, visitor: v } }).catch(() => {});
    } catch { /* tracking is best effort */ }
  };
  useEffect(() => { const k = `ad_viewed_${a.id}`; try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch { /* ignore */ } track("view"); }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const message = async () => {
    track("contact");
    if (!signedIn) { navigate({ to: "/auth" }); return; }
    setBusy(true);
    try { const t = await open({ data: { agentId: a.id } }); navigate({ to: "/messages/$id", params: { id: t.id } }); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const name = o?.name || a.name;
  const pick = (k: "website" | "portfolio_url" | "linkedin" | "github") => (a as Record<string, unknown>)[k] as string | null || (o as Record<string, unknown> | null)?.[k] as string | null;
  const links = [
    { href: pick("website"), label: "Website", icon: Globe }, { href: pick("portfolio_url"), label: "Portfolio", icon: FolderOpen }, { href: pick("linkedin"), label: "LinkedIn", icon: Linkedin },
    { href: a.behance, label: "Behance", icon: PenTool }, { href: a.dribbble, label: "Dribbble", icon: Palette }, { href: pick("github"), label: "GitHub", icon: Github },
    { href: o?.twitter, label: "X", icon: Twitter }, { href: o?.instagram, label: "Instagram", icon: Instagram },
  ].filter((l) => l.href);
  const work = ((a.portfolio_items as { title: string; url: string; description?: string }[] | null) ?? []);
  const skills = Array.from(new Set([...(a.skills ?? []), ...((o?.skills as string[] | null) ?? [])]));

  return <div className="relative min-h-screen overflow-hidden bg-background">
    
    <PublicHeader />
    <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-10">
      <Link to="/sellers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All sellers</Link>
      <section className="mt-8 border-b pb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <Avatar name={name} src={o?.avatar_url} demo={a.is_demo} className="size-28 rounded-lg text-2xl" />
          <div className="min-w-0 flex-1">
            <h1 className="display break-words text-4xl font-semibold">{name}</h1>
            <p className="mt-1.5 text-muted-foreground">{o?.headline || a.category}{a.is_demo ? " · Demo seller run by an AI agent" : ""}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {o?.company && <span className="flex items-center gap-1.5"><Briefcase className="size-4" />{o.company}</span>}
              {o?.location && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{o.location}</span>}
              <RatingBadge rating={a.rating} count={a.review_count} long className="text-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
            <Button size="lg" className="rounded-md px-6" onClick={message} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <MessageCircle />}Message</Button>
            <Button asChild size="lg" variant="outline" className="rounded-md px-6"><Link to={signedIn ? "/new" : "/auth"}>Start a request</Link></Button>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 divide-x border-y">
          {[["Starting at", money(Number(a.base_price))], ["Typical delivery", `${a.delivery_hours}h`], [a.is_demo ? "Demo jobs" : "Completed jobs", String(completed)]].map(([l, v]) => <div key={l} className="px-2 py-5 text-center sm:px-5"><p className="text-xs text-muted-foreground">{l}</p><p className="display mt-1 text-xl font-semibold tabular-nums">{v}</p></div>)}
        </div>
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-8">
          <div className="border-b pb-8"><h2 className="font-semibold">About</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-muted-foreground">{o?.bio || a.description}</p></div>
          {(o?.experience) && <div className="border-b pb-8"><h2 className="font-semibold">Experience</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-muted-foreground">{o.experience}</p></div>}
          {work.length > 0 && <div className="border-b pb-8"><h2 className="font-semibold">Portfolio</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{work.map((w, i) => <a key={i} href={w.url} onClick={() => track("link")} target="_blank" rel="noopener noreferrer nofollow" className="group rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30"><div className="flex items-start justify-between gap-3"><h3 className="font-medium">{w.title}</h3><ExternalLink className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" /></div>{w.description && <p className="mt-1.5 text-sm text-muted-foreground">{w.description}</p>}<p className="mt-2 truncate text-xs text-muted-foreground">{w.url.replace(/^https?:\/\//, "")}</p></a>)}</div></div>}
          <div className="border-b pb-8"><h2 className="font-semibold">How they work</h2><p className="mt-3 text-[15px] leading-7 text-muted-foreground">{a.negotiation_style}</p></div>
          <div className="pb-8" id="reviews"><div className="flex items-baseline justify-between"><h2 className="font-semibold">Reviews</h2>{a.review_count > 0 && <RatingBadge rating={a.rating} count={a.review_count} long />}</div>
            {a.review_count > 0 && <div className="mt-4 space-y-1.5">{[5, 4, 3, 2, 1].map((n) => { const c = reviews.filter((r) => r.rating === n).length; return <div key={n} className="flex items-center gap-3 text-xs"><span className="w-12 text-muted-foreground">{n} star</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-amber-400" style={{ width: `${(c / reviews.length) * 100}%` }} /></div><span className="w-6 text-right tabular-nums text-muted-foreground">{c}</span></div>; })}</div>}
            {reviews.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No reviews yet. Reviews come only from buyers who completed a paid deal with this seller.</p> :
              <ul className="mt-6 space-y-5">{reviews.map((r) => <li key={r.id} className="border-t pt-5"><div className="flex items-center gap-3"><Avatar name={r.name} src={r.avatar_url} className="size-9 rounded-full text-xs" /><div><p className="text-sm font-medium">{r.name}</p><p className="text-[11px] text-muted-foreground">Verified buyer · {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p></div><span className="ml-auto"><Stars value={r.rating} size="size-3.5" /></span></div>{r.comment && <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{r.comment}</p>}</li>)}</ul>}
          </div>
        </section>
        <aside className="space-y-8">
          <div className="border-b pb-8"><h2 className="font-semibold">Skills</h2><div className="mt-4 flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="rounded-md border bg-card px-3 py-1.5 text-xs">{s}</span>)}</div></div>
          {links.length > 0 && <div className="border-b pb-8"><h2 className="font-semibold">Links & work</h2><ul className="mt-4 space-y-2">{links.map((l) => <li key={l.label}><a href={l.href ?? undefined} onClick={() => track("link")} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 rounded-md py-2 text-sm hover:bg-secondary"><l.icon className="size-4 text-muted-foreground" />{l.label}</a></li>)}</ul></div>}
          {a.is_demo && <p className="px-2 text-xs leading-5 text-muted-foreground">This is a demo seller. Messages are answered by an AI agent and it has no real portfolio.</p>}
        </aside>
      </div>
    </div>
  </div>;
}
