import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Paperclip, FileText, X, Download, MapPin, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { supabase } from "@/integrations/supabase/client";
import { sendDirect, threadPeople, conversationProfile } from "@/lib/dm.functions";
import { useAccount } from "@/hooks/use-account";
import { Avatar } from "@/components/public-header";
import { pageHead } from "@/lib/head";
import { Linkify } from "@/components/linkify";

export const Route = createFileRoute("/_authenticated/messages/$id")({ head: () => pageHead("Conversation", "A private conversation on AgentDeal."), component: Thread });
type DM = { id: string; sender_id: string | null; sender_kind: string; content: string; file_path: string | null; file_name: string | null; created_at: string };

function Attachment({ path, name }: { path: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from("direct-attachments").download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't download this file."); }
    finally { setBusy(false); }
  };
  return <Button variant="outline" disabled={busy} onClick={download} className="h-auto max-w-full justify-start gap-3 bg-card py-3 text-foreground" aria-label={`Download ${name}`}><FileText className="shrink-0" /><span className="min-w-0 break-all whitespace-normal text-left">{name}</span><Download className="ml-auto shrink-0" /></Button>;
}

function Thread() {
  const { id } = Route.useParams(); const { data: account } = useAccount(); const qc = useQueryClient();
  const send = useServerFn(sendDirect); const people = useServerFn(threadPeople); const getProfile = useServerFn(conversationProfile);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [file, setFile] = useState<File | null>(null); const [showProfile, setShowProfile] = useState(false);
  const input = useRef<HTMLInputElement>(null); const draftId = useRef(crypto.randomUUID()); const uploaded = useRef<string | null>(null);
  const me = account?.profile?.id; const blocked = !!account?.profile?.blocked;
  const q = useQuery({ queryKey: ["dm", id], enabled: !!me, queryFn: async () => {
    const [{ data: t, error }, { data: msgs, error: messageError }] = await Promise.all([
      supabase.from("direct_threads").select("*, provider_agents(id, name, is_demo, category)").eq("id", id).single(),
      supabase.from("direct_messages").select("*").eq("thread_id", id).order("created_at"),
    ]);
    if (error) throw error; if (messageError) throw messageError;
    const otherId = t.buyer_id === me ? t.seller_id : t.buyer_id;
    const ppl = otherId ? await people({ data: { ids: [otherId] } }) : {};
    return { t, msgs: (msgs ?? []) as DM[], otherId, other: otherId ? ppl[otherId] ?? null : null };
  } });
  const profile = useQuery({ queryKey: ["partner-profile", id, q.data?.otherId], enabled: showProfile && !!q.data?.otherId, queryFn: async () => {
    if (!q.data?.otherId) return null;
    return getProfile({ data: { threadId: id, personId: q.data.otherId } });
  } });
  useEffect(() => {
    const ch = supabase.channel(`dm-${id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `thread_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["dm", id] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);
  const chooseFile = (selected?: File) => {
    if (!selected) return;
    if (selected.size > 20 * 1024 * 1024) { toast.error("Files must be 20 MB or smaller."); return; }
    if (selected.name.length > 255) { toast.error("Please shorten the file name."); return; }
    if (uploaded.current) void supabase.storage.from("direct-attachments").remove([uploaded.current]);
    uploaded.current = null; draftId.current = crypto.randomUUID(); setFile(selected);
  };
  const submit = async () => {
    if ((!text.trim() && !file) || busy || blocked || !me) return;
    setBusy(true);
    try {
      if (file && !uploaded.current) {
        const path = `${me}/${id}/${draftId.current}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error } = await supabase.storage.from("direct-attachments").upload(path, file);
        if (error) throw error; uploaded.current = path;
      }
      const result = await send({ data: { threadId: id, messageId: draftId.current, content: text.trim(), filePath: uploaded.current, fileName: file?.name ?? null } });
      setText(""); setFile(null); uploaded.current = null; draftId.current = crypto.randomUUID();
      if (result.warning) toast.error(result.warning);
      await qc.invalidateQueries({ queryKey: ["dm", id] }); void qc.invalidateQueries({ queryKey: ["inbox"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't send your message."); throw e; }
    finally { setBusy(false); }
  };
  if (q.isLoading || !me) return <div className="space-y-4"><Skeleton className="h-14 w-1/2" /><Skeleton className="h-[480px] rounded-lg" /></div>;
  if (q.error || !q.data) return <p className="text-muted-foreground">This conversation couldn't be loaded. <Link to="/messages" className="text-primary">Back to messages</Link></p>;
  const { t, msgs, other } = q.data; const a = t.provider_agents; const buyer = t.buyer_id === me; const title = buyer ? a?.name ?? "Seller" : other?.name ?? "Buyer";
  const p = profile.data;
  return <div className="mx-auto flex h-[calc(100dvh-112px)] min-h-[480px] max-w-4xl flex-col">
    <header className="flex flex-wrap items-center gap-3 border-b pb-5">
      <Button asChild variant="ghost" size="icon"><Link to="/messages" aria-label="Back to messages"><ArrowLeft /></Link></Button>
      <Avatar name={title} src={other?.avatar_url} demo={buyer && !!a?.is_demo} />
      <div className="min-w-0 flex-1"><h1 className="truncate font-semibold">{title}</h1><p className="text-xs text-muted-foreground">{buyer ? `${a?.category ?? ""}${a?.is_demo ? " · Demo seller, replies by AI agent" : ""}` : other?.headline ?? "Buyer"}</p></div>
      <div className="flex gap-2">{buyer && a ? <Button asChild variant="outline" size="sm"><Link to="/sellers/$id" params={{ id: a.id }}>Profile</Link></Button> : <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}>Profile</Button>}{buyer && a && <Button asChild size="sm"><Link to="/new">Start a request</Link></Button>}</div>
    </header>
    <Conversation className="min-h-0" initial="instant" resize="instant"><ConversationContent className="gap-5 px-0 py-6 md:px-4">
      {msgs.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No messages yet.</p>}
      {msgs.map((m) => <Message key={m.id} from={m.sender_id === me ? "user" : "assistant"} className="max-w-[85%]">
        <MessageContent className="group-[.is-user]:bg-foreground group-[.is-user]:text-background">
          {m.sender_kind === "agent" && <p className="text-xs text-muted-foreground">Demo seller · AI agent</p>}
          {m.sender_kind === "agent" ? <MessageResponse>{m.content}</MessageResponse> : <p className="whitespace-pre-wrap break-words"><Linkify text={m.content} /></p>}
          {m.file_path && <Attachment path={m.file_path} name={m.file_name ?? "Attachment"} />}
          <time className={m.sender_id === me ? "text-[10px] text-background/70" : "text-[10px] text-muted-foreground"}>{new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
        </MessageContent>
      </Message>)}
      {busy && <p role="status" className="text-xs text-muted-foreground">{buyer && a?.is_demo ? `${a.name}'s agent is replying` : "Sending…"}</p>}
    </ConversationContent><ConversationScrollButton aria-label="Latest messages" /></Conversation>
    <input ref={input} type="file" className="hidden" onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
    <PromptInput onSubmit={submit} className="mt-3" onError={(e) => toast.error(e.message)}>
      {file && <div className="flex items-center gap-2 border-b px-4 py-3 text-sm"><FileText className="size-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span><Button type="button" size="icon" variant="ghost" disabled={busy} aria-label="Remove attachment" onClick={() => { if (uploaded.current) void supabase.storage.from("direct-attachments").remove([uploaded.current]); uploaded.current = null; setFile(null); draftId.current = crypto.randomUUID(); }}><X /></Button></div>}
      <PromptInputTextarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder={blocked ? "Your account is blocked" : "Write a message…"} disabled={busy || blocked} />
      <PromptInputFooter className="justify-between"><Button type="button" size="icon" variant="ghost" title="Attach file" aria-label="Attach file" disabled={busy || blocked} onClick={() => input.current?.click()}><Paperclip /></Button><PromptInputSubmit aria-label="Send" status={busy ? "submitted" : "ready"} disabled={(!text.trim() && !file) || busy || blocked} /></PromptInputFooter>
    </PromptInput>
    <Dialog open={showProfile} onOpenChange={setShowProfile}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{p?.name ?? title}</DialogTitle></DialogHeader>{profile.isLoading ? <Skeleton className="h-48" /> : p ? <div className="space-y-5"><div className="flex items-center gap-4"><Avatar name={p.name ?? title} src={p.avatar_url} className="size-16" /><div><p>{p.headline}</p><p className="text-sm text-muted-foreground">{p.category}</p></div></div>{p.company && <p className="flex items-center gap-2 text-sm"><Briefcase className="size-4" />{p.company}</p>}{p.location && <p className="flex items-center gap-2 text-sm"><MapPin className="size-4" />{p.location}</p>}{p.bio && <section><h2 className="mb-2 font-medium">About</h2><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{p.bio}</p></section>}{p.experience && <section><h2 className="mb-2 font-medium">Experience</h2><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{p.experience}</p></section>}<div className="flex flex-wrap gap-2">{p.skills?.map((s) => <span className="border px-2 py-1 text-xs" key={s}>{s}</span>)}</div>{[["Website",p.website],["Portfolio",p.portfolio_url],["LinkedIn",p.linkedin],["GitHub",p.github],["Instagram",p.instagram],["X",p.twitter]].filter(([,url]) => !!url).map(([label,url]) => url && <a key={label} className="block text-sm underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}</div> : <p className="text-sm text-muted-foreground">This profile isn't available.</p>}</DialogContent></Dialog>
  </div>;
}
