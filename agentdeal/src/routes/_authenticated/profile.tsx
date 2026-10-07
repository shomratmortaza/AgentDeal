import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, X, LifeBuoy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile } from "@/lib/market.functions";
import { useAccount } from "@/hooks/use-account";
import { Card, PageHeader } from "@/components/bits";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/profile")({ head: () => pageHead("Profile", "Your photo, skills, experience and links on AgentDeal."), component: Profile });

type Form = { name: string; bio: string; headline: string; category: string; skills: string[]; experience: string; company: string; location: string; website: string; portfolio_url: string; linkedin: string; twitter: string; github: string; instagram: string; avatar_url: string | null };
const CATEGORIES = ["Video production", "Design", "Development", "Writing", "Marketing", "Photography", "Music & audio", "Business", "Other"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-sm font-medium">{label}<div className="mt-2">{children}</div>{hint && <p className="mt-1.5 text-xs font-normal text-muted-foreground">{hint}</p>}</label>;
}

function Profile() {
  const { data: a } = useAccount(); const qc = useQueryClient(); const save = useServerFn(updateProfile);
  const [f, setF] = useState<Form | null>(null); const [skill, setSkill] = useState(""); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!a?.profile || f) return; const p = a.profile;
    setF({ name: p.name ?? "", bio: p.bio ?? "", headline: p.headline ?? "", category: p.category ?? "", skills: p.skills ?? [], experience: p.experience ?? "", company: p.company ?? "", location: p.location ?? "", website: p.website ?? "", portfolio_url: p.portfolio_url ?? "", linkedin: p.linkedin ?? "", twitter: p.twitter ?? "", github: p.github ?? "", instagram: p.instagram ?? "", avatar_url: p.avatar_url ?? null });
  }, [a, f]);
  if (!a || !f) return <Skeleton className="h-96 w-full max-w-2xl" />;
  const isSeller = a.role === "seller";
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });
  const addSkill = () => { const s = skill.trim(); if (!s || f.skills.includes(s) || f.skills.length >= 20) return; set("skills", [...f.skills, s]); setSkill(""); };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB."); return; }
    setUploading(true);
    try {
      const path = `${a.profile!.id}/avatar-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data, error: e2 } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (e2 || !data) throw e2 ?? new Error("Could not read photo");
      set("avatar_url", data.signedUrl); toast.success("Photo ready — press Save profile to keep it.");
    } catch (e) { toast.error((e as Error).message); } finally { setUploading(false); }
  };

  const submit = async () => {
    setBusy(true);
    try { await save({ data: f }); await qc.invalidateQueries({ queryKey: ["account"] }); toast.success("Profile saved"); }
    catch (e) { const m = (e as Error).message; toast.error(m.includes("http") ? "Links must start with http:// or https://" : m); }
    finally { setBusy(false); }
  };

  const initials = (f.name || "··").slice(0, 2).toUpperCase();
  return <>
    <PageHeader title="Profile" subtitle={isSeller ? "This is how buyers get to know you." : "Tell sellers who you are and what you work on."} />
    <div className="max-w-2xl space-y-6 pb-16">
      <Card className="flex items-center gap-6">
        <button type="button" onClick={() => fileRef.current?.click()} className="group relative size-24 shrink-0 overflow-hidden rounded-full bg-secondary" aria-label="Change photo">
          {f.avatar_url ? <img src={f.avatar_url} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xl font-semibold">{initials}</span>}
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-background opacity-0 transition group-hover:opacity-100">{uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ""; }} />
        <div className="min-w-0"><p className="text-lg font-semibold">{f.name || "Your name"}</p><p className="text-sm text-muted-foreground">{a.profile?.email}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{[a.isAdmin && "Admin", a.role].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={uploading}>{f.avatar_url ? "Change photo" : "Upload photo"}</Button>{f.avatar_url && <Button size="sm" variant="ghost" className="rounded-full" onClick={() => set("avatar_url", null)}>Remove</Button>}</div></div>
      </Card>

      <Card className="space-y-5"><h2 className="font-semibold">About</h2>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Full name"><Input value={f.name} maxLength={80} onChange={(e) => set("name", e.target.value)} /></Field><Field label="Headline"><Input value={f.headline} maxLength={120} placeholder={isSeller ? "Motion designer for SaaS brands" : "Founder at a coffee startup"} onChange={(e) => set("headline", e.target.value)} /></Field></div>
        <Field label="Bio"><Textarea rows={4} maxLength={1000} value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A few sentences about you." /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label={isSeller ? "Company or studio" : "Company"}><Input value={f.company} maxLength={100} onChange={(e) => set("company", e.target.value)} /></Field><Field label="Location"><Input value={f.location} maxLength={100} placeholder="Dhaka, Bangladesh" onChange={(e) => set("location", e.target.value)} /></Field></div>
      </Card>

      <Card className="space-y-5"><h2 className="font-semibold">{isSeller ? "Work & skills" : "Interests"}</h2>
        <Field label={isSeller ? "Main category" : "What you usually buy"}><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">Choose…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label={isSeller ? "Skills" : "Topics"} hint="Press Enter to add. Up to 20.">
          <div className="flex gap-2"><Input value={skill} maxLength={40} placeholder="e.g. After Effects" onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} /><Button type="button" variant="outline" onClick={addSkill}>Add</Button></div>
          {f.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{f.skills.map((s) => <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => set("skills", f.skills.filter((x) => x !== s))}><X className="size-3" /></button></span>)}</div>}
        </Field>
        <Field label="Experience"><Textarea rows={5} maxLength={2000} value={f.experience} onChange={(e) => set("experience", e.target.value)} placeholder={isSeller ? "Years of experience, notable clients, past projects…" : "Your role and the kind of projects you run."} /></Field>
      </Card>

      <Card className="space-y-5"><h2 className="font-semibold">Links</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website"><Input value={f.website} placeholder="https://" onChange={(e) => set("website", e.target.value)} /></Field>
          <Field label="Portfolio"><Input value={f.portfolio_url} placeholder="https://" onChange={(e) => set("portfolio_url", e.target.value)} /></Field>
          <Field label="LinkedIn"><Input value={f.linkedin} placeholder="https://linkedin.com/in/…" onChange={(e) => set("linkedin", e.target.value)} /></Field>
          <Field label="X / Twitter"><Input value={f.twitter} placeholder="https://x.com/…" onChange={(e) => set("twitter", e.target.value)} /></Field>
          <Field label="GitHub"><Input value={f.github} placeholder="https://github.com/…" onChange={(e) => set("github", e.target.value)} /></Field>
          <Field label="Instagram"><Input value={f.instagram} placeholder="https://instagram.com/…" onChange={(e) => set("instagram", e.target.value)} /></Field>
        </div>
      </Card>

      <div className="flex justify-end"><Button className="rounded-full px-6" disabled={busy || uploading || f.name.trim().length < 2} onClick={submit}>{busy && <Loader2 className="animate-spin" />}Save profile</Button></div>

      <Card className="space-y-1 p-0">
        <Link to="/support" className="flex items-center gap-4 p-5 transition-colors hover:bg-card/70">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><LifeBuoy className="size-5 text-signal" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Help & support</span>
            <span className="block text-sm text-muted-foreground">Problem with a payment, a deal or your account? Message our team and track the reply here.</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </Card>
    </div>
  </>;
}
