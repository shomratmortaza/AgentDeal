import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, Users, MessageCircle, MousePointerClick, Target, Handshake, Plus, Trash2, ExternalLink, Globe, FolderOpen, Linkedin, Github, PenTool, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { saveListing, deleteListing, getListingStats } from "@/lib/market.functions";
import { useAccount } from "@/hooks/use-account";
import { Card, PageHeader } from "@/components/bits";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/listing")({ validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}), head: () => pageHead("My listings", "Create several listings, edit them, add your portfolio and see how many buyers view it."), component: Listing });

const cats = ["Video production", "Design", "Development", "Writing", "Other"] as const;
const url = z.string().trim().max(300).refine((v) => !v || /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(v), "Enter a valid link");
const schema = z.object({
  name: z.string().trim().min(2, "Required").max(80), description: z.string().trim().min(20, "At least 20 characters").max(600), category: z.enum(cats),
  skills: z.string().trim().min(2, "Add at least one skill"), base_price: z.coerce.number().positive("Must be positive").max(100000), delivery_hours: z.coerce.number().int().positive("Must be positive").max(2160),
  negotiation_style: z.string().trim().min(3, "Required").max(200), is_active: z.boolean(),
  website: url, portfolio_url: url, linkedin: url, github: url, behance: url, dribbble: url,
  portfolio_items: z.array(z.object({ title: z.string().trim().min(2, "Add a title").max(80), url: url.refine((v) => !!v, "Add a link"), description: z.string().trim().max(240) })).max(12),
});
type F = z.input<typeof schema>;
type Item = { title: string; url: string; description: string };

const linkFields = [
  { k: "website", label: "Website", icon: Globe, ph: "yourstudio.com" }, { k: "portfolio_url", label: "Portfolio", icon: FolderOpen, ph: "portfolio link" },
  { k: "linkedin", label: "LinkedIn", icon: Linkedin, ph: "linkedin.com/in/you" }, { k: "github", label: "GitHub", icon: Github, ph: "github.com/you" },
  { k: "behance", label: "Behance", icon: PenTool, ph: "behance.net/you" }, { k: "dribbble", label: "Dribbble", icon: Palette, ph: "dribbble.com/you" },
] as const;

type Acc = ReturnType<typeof useAccount>["data"];
type L = NonNullable<Acc>["listings"][number];
function defaults(account: Acc, l?: L | null): F {
  return {
    name: l?.name ?? account?.profile?.name ?? "", description: l?.description ?? "", category: (cats as readonly string[]).includes(l?.category ?? "") ? (l!.category as F["category"]) : "Design",
    skills: l?.skills.join(", ") ?? "", base_price: l ? Number(l.base_price) : 100, delivery_hours: l?.delivery_hours ?? 48, negotiation_style: l?.negotiation_style ?? "Open to reasonable offers", is_active: l?.is_active ?? true,
    website: l?.website ?? "", portfolio_url: l?.portfolio_url ?? "", linkedin: l?.linkedin ?? "", github: l?.github ?? "", behance: l?.behance ?? "", dribbble: l?.dribbble ?? "",
    portfolio_items: ((l?.portfolio_items as Item[] | null) ?? []).map((i) => ({ title: i.title, url: i.url, description: i.description ?? "" })),
  };
}

function Listing() {
  const { data: account, isLoading } = useAccount(); const qc = useQueryClient();
  const save = useServerFn(saveListing); const remove = useServerFn(deleteListing); const statsFn = useServerFn(getListingStats);
  const { id } = Route.useSearch(); const navigate = Route.useNavigate();
  const listings = account?.listings ?? [];
  const creating = id === "new" || (!id && listings.length === 0);
  const l = creating ? null : (listings.find((x) => x.id === id) ?? listings[0] ?? null);
  const stats = useQuery({ queryKey: ["listing-stats", l?.id], queryFn: () => statsFn({ data: { id: l!.id } }), enabled: !!l });
  const form = useForm<F, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema), defaultValues: defaults(account, l) });
  const items = useFieldArray({ control: form.control, name: "portfolio_items" });
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { if (account) form.reset(defaults(account, l)); }, [l?.id, l?.updated_at, creating, !!account]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <p className="text-muted-foreground">Loading your listing…</p>;
  if (account?.role !== "seller") return <p className="text-muted-foreground">Only seller accounts have a listing.</p>;
  const e = form.formState.errors;
  const submit = form.handleSubmit(async (v) => {
    try {
      const res = await save({ data: { ...v, id: l?.id ?? null, skills: v.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12) } });
      await qc.invalidateQueries({ queryKey: ["account"] }); toast.success(l ? "Listing updated" : "Listing published");
      if (!l) navigate({ search: { id: res.id }, replace: true });
    } catch (err) { toast.error((err as Error).message); }
  });
  const onDelete = async () => {
    setDeleting(true);
    try { await remove({ data: { id: l!.id } }); await qc.invalidateQueries({ queryKey: ["account"] }); navigate({ search: {}, replace: true }); toast.success("Listing deleted"); }
    catch (err) { toast.error((err as Error).message); } finally { setDeleting(false); }
  };
  const field = (k: string, label: string, el: React.ReactNode, err?: { message?: string }) => <label className="block text-sm font-medium">{label}<div className="mt-2">{el}</div>{err?.message && <p className="mt-1 text-xs text-destructive">{err.message}</p>}</label>;
  const s = stats.data;
  const tiles = [
    { label: "Profile views", value: s?.views, icon: Eye, hint: "Last 30 days" }, { label: "Unique visitors", value: s?.visitors, icon: Users, hint: "Last 30 days" },
    { label: "Message clicks", value: s?.contacts, icon: MessageCircle, hint: "Last 30 days" }, { label: "Link clicks", value: s?.linkClicks, icon: MousePointerClick, hint: "Last 30 days" },
    { label: "Times matched", value: s?.matches, icon: Target, hint: "Shown in a buyer's top 3" }, { label: "Deals started", value: s?.deals, icon: Handshake, hint: "Buyer picked you" },
  ];
  const max = Math.max(1, ...(s?.daily ?? []).map((d) => d.views));

  return <>
    <PageHeader title="My listings" subtitle="Offer different services as separate listings. Each one is matched, viewed and reviewed on its own."
      action={<Button disabled={listings.length >= 10} onClick={() => navigate({ search: { id: "new" } })}><Plus />New listing</Button>} />

    {listings.length > 0 && <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((x) => <button key={x.id} type="button" onClick={() => navigate({ search: { id: x.id } })}
        className={`rounded-2xl border p-4 text-left transition-colors ${l?.id === x.id ? "border-signal bg-signal/10" : "bg-card hover:border-white/20"}`}>
        <div className="flex items-start justify-between gap-2"><p className="font-semibold">{x.name}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${x.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{x.is_active ? "Live" : "Paused"}</span></div>
        <p className="mt-1 text-xs text-muted-foreground">{x.category} · from <span className="mono">${Number(x.base_price)}</span></p>
      </button>)}
      {creating && <div className="rounded-2xl border border-dashed border-signal p-4"><p className="font-semibold">New listing</p><p className="mt-1 text-xs text-muted-foreground">Fill in the form below</p></div>}
    </div>}

    {l && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{l.name}</h2><Button asChild variant="outline" size="sm"><Link to="/sellers/$id" params={{ id: l.id }}><ExternalLink />View public page</Link></Button></div>}

    {l && <section className="mb-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => <Card key={t.label} className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><t.icon className="size-4" />{t.label}</div><p className="display mt-2 text-2xl font-semibold tabular-nums">{stats.isLoading ? "—" : (t.value ?? 0)}</p><p className="mt-1 text-[11px] text-muted-foreground">{t.hint}</p></Card>)}
      </div>
      <Card className="mt-3 p-5">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Views, last 14 days</h2>{!l.is_active && <span className="text-xs text-muted-foreground">Listing is paused — buyers can't find it</span>}</div>
        <div className="mt-4 flex h-28 items-end gap-1.5" role="img" aria-label="Daily profile views for the last 14 days">
          {(s?.daily ?? Array.from({ length: 14 }, (_, i) => ({ day: String(i), views: 0 }))).map((d) => <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100">{d.views}</span>
            <div className="w-full rounded-t-md bg-signal/70" style={{ height: `${Math.max(3, (d.views / max) * 88)}px` }} title={`${d.day}: ${d.views} views`} />
          </div>)}
        </div>
      </Card>
    </section>}

    <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" noValidate>
      <div className="space-y-6">
        <Card className="space-y-5"><h2 className="font-semibold">Service details</h2>
          {field("name", "Display name", <Input {...form.register("name")} />, e.name)}
          {field("description", "What you offer", <textarea rows={4} className="w-full rounded-md border bg-background p-3 text-sm" {...form.register("description")} />, e.description)}
          <div className="grid gap-5 sm:grid-cols-2">
            {field("category", "Category", <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" {...form.register("category")}>{cats.map((c) => <option key={c}>{c}</option>)}</select>)}
            {field("skills", "Skills (comma separated)", <Input placeholder="logo design, branding" {...form.register("skills")} />, e.skills)}
            {field("base_price", "Starting price (USD)", <Input type="number" {...form.register("base_price")} />, e.base_price)}
            {field("delivery_hours", "Typical delivery (hours)", <Input type="number" {...form.register("delivery_hours")} />, e.delivery_hours)}
          </div>
          {field("negotiation_style", "Negotiation style", <Input {...form.register("negotiation_style")} />, e.negotiation_style)}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Portfolio</h2><p className="text-sm text-muted-foreground">Show past projects buyers can open.</p></div>
            <Button type="button" variant="outline" size="sm" disabled={items.fields.length >= 12} onClick={() => items.append({ title: "", url: "", description: "" })}><Plus />Add project</Button></div>
          {items.fields.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No projects yet. Add your best work with a link to it.</p>}
          {items.fields.map((f, i) => <div key={f.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Project {i + 1}</span><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove project ${i + 1}`} onClick={() => items.remove(i)}><Trash2 /></Button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {field(`t${i}`, "Title", <Input {...form.register(`portfolio_items.${i}.title`)} />, e.portfolio_items?.[i]?.title)}
              {field(`u${i}`, "Link", <Input placeholder="behance.net/gallery/…" {...form.register(`portfolio_items.${i}.url`)} />, e.portfolio_items?.[i]?.url)}
            </div>
            {field(`d${i}`, "Short description (optional)", <Input {...form.register(`portfolio_items.${i}.description`)} />, e.portfolio_items?.[i]?.description)}
          </div>)}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4"><h2 className="font-semibold">Links</h2>
          {linkFields.map((lf) => <label key={lf.k} className="block text-sm font-medium"><span className="flex items-center gap-2"><lf.icon className="size-4 text-muted-foreground" />{lf.label}</span>
            <Input className="mt-2" placeholder={lf.ph} {...form.register(lf.k)} />{e[lf.k]?.message && <p className="mt-1 text-xs text-destructive">{e[lf.k]?.message}</p>}</label>)}
        </Card>
        <Card className="space-y-4">
          <label className="flex items-center justify-between gap-3 text-sm"><span>Listing is live and can be matched</span><Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v, { shouldDirty: true })} /></label>
          <Button disabled={form.formState.isSubmitting} className="w-full">{form.formState.isSubmitting ? "Saving…" : l ? "Save changes" : "Publish listing"}</Button>
          {l && <AlertDialog>
            <AlertDialogTrigger asChild><Button type="button" variant="outline" className="w-full text-destructive" disabled={deleting}><Trash2 />{deleting ? "Deleting…" : "Delete listing"}</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete this listing?</AlertDialogTitle><AlertDialogDescription>Buyers will no longer find or match with this listing, and its stats will be cleared from view. Past deals and payments stay in your history. Your other listings are not affected.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Keep listing</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete listing</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>}
        </Card>
      </div>
    </form>
  </>;
}
