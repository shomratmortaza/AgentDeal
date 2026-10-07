import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAdmin, useRefreshAdmin } from "@/hooks/use-admin";
import { adminCancelRequest } from "@/lib/market.functions";
import { Empty, ListSkeleton, PageHeader, StatusBadge } from "@/components/bits";
import { money, requestStatus } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/admin/requests")({ head: () => pageHead("Requests", "All AgentDeal requests."), component: Requests });

function Requests() {
  const { data, isLoading } = useAdmin(); const refresh = useRefreshAdmin(); const cancel = useServerFn(adminCancelRequest);
  const [f, setF] = useState("all"); const [target, setTarget] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const rows = (data?.requests ?? []).filter((r) => f === "all" || r.status === f);
  const name = (id: string) => data?.profiles.find((p) => p.id === id)?.name ?? "—";
  return <><PageHeader title="Requests" subtitle={`${data?.requests.length ?? 0} total`} />
    <div className="mb-5 flex flex-wrap gap-2">{["all", ...Object.keys(requestStatus).filter((k) => k !== "draft")].map((k) => <Button key={k} size="sm" variant={f === k ? "default" : "outline"} className="rounded-full" onClick={() => setF(k)}>{k === "all" ? "All" : requestStatus[k]}</Button>)}</div>
    {isLoading ? <ListSkeleton /> : !rows.length ? <Empty icon={FileText} title="No requests" text="Nothing matches this filter." /> :
      <div className="overflow-x-auto rounded-2xl border bg-card soft-shadow"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-4 font-normal">Title</th><th className="p-4 font-normal">Buyer</th><th className="p-4 font-normal">Budget</th><th className="p-4 font-normal">Status</th><th className="p-4 font-normal">Created</th><th className="p-4" /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="p-4 font-medium">{r.title}</td><td className="p-4 text-muted-foreground">{name(r.buyer_id)}</td><td className="p-4">{r.budget ? money(Number(r.budget)) : "—"}</td><td className="p-4"><StatusBadge status={r.status} /></td><td className="p-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td><td className="p-4 text-right">{!["completed", "cancelled"].includes(r.status) && <Button size="sm" variant="outline" onClick={() => setTarget(r.id)}>Cancel</Button>}</td></tr>)}</tbody></table></div>}
    <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel this request?</AlertDialogTitle><AlertDialogDescription>If a payment is being held, it will be refunded to the buyer through PayPal. This can't be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={async (e) => { e.preventDefault(); setBusy(true); try { const r = await cancel({ data: { requestId: target! } }); toast.success(r.refunded ? "Cancelled and refunded" : "Cancelled"); refresh(); setTarget(null); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); } }}>Cancel request</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
