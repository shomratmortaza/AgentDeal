import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdmin, useRefreshAdmin } from "@/hooks/use-admin";
import { adminSetBlocked } from "@/lib/market.functions";
import { Empty, ListSkeleton, PageHeader } from "@/components/bits";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/admin/users")({ head: () => pageHead("Users", "Manage AgentDeal users."), component: UsersPage });

function UsersPage() {
  const { data, isLoading } = useAdmin(); const refresh = useRefreshAdmin(); const block = useServerFn(adminSetBlocked);
  const [q, setQ] = useState(""); const [role, setRole] = useState("all"); const [view, setView] = useState<string | null>(null);
  const rows = useMemo(() => (data?.profiles ?? []).map((p) => ({ ...p, roles: data!.roles.filter((r) => r.user_id === p.id).map((r) => r.role) })).filter((p) => (role === "all" || p.roles.includes(role as never) || (role === "blocked" && p.blocked)) && `${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase())), [data, q, role]);
  const sel = rows.find((r) => r.id === view);
  return <><PageHeader title="Users" subtitle={`${data?.profiles.length ?? 0} accounts`} />
    <div className="mb-5 flex flex-wrap gap-3"><Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" /><select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">{["all", "buyer", "seller", "admin", "blocked"].map((r) => <option key={r} value={r}>{r[0]!.toUpperCase() + r.slice(1)}</option>)}</select></div>
    {isLoading ? <ListSkeleton /> : !rows.length ? <Empty icon={Users} title="No users found" text="Try a different search or filter." /> :
      <div className="overflow-x-auto rounded-2xl border bg-card soft-shadow"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-4 font-normal">Name</th><th className="p-4 font-normal">Email</th><th className="p-4 font-normal">Role</th><th className="p-4 font-normal">Joined</th><th className="p-4" /></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className="border-b last:border-0"><td className="p-4 font-medium">{u.name}{u.blocked && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-destructive">Blocked</span>}</td><td className="p-4 text-muted-foreground">{u.email}</td><td className="p-4 capitalize">{u.roles.join(", ") || "—"}</td><td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td><td className="p-4 text-right"><Button size="sm" variant="ghost" onClick={() => setView(u.id)}>View</Button>{!u.roles.includes("admin") && <Button size="sm" variant="outline" onClick={async () => { try { await block({ data: { userId: u.id, blocked: !u.blocked } }); toast.success(u.blocked ? "Unblocked" : "Blocked"); refresh(); } catch (e) { toast.error((e as Error).message); } }}>{u.blocked ? "Unblock" : "Block"}</Button>}</td></tr>)}</tbody></table></div>}
    <Dialog open={!!sel} onOpenChange={(o) => !o && setView(null)}><DialogContent>{sel && <><DialogHeader><DialogTitle>{sel.name}</DialogTitle></DialogHeader><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{sel.email}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Roles</dt><dd className="capitalize">{sel.roles.join(", ") || "—"}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{sel.blocked ? "Blocked" : "Active"}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Requests</dt><dd>{data!.requests.filter((r) => r.buyer_id === sel.id).length}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Spent</dt><dd>{money(data!.transactions.filter((t) => t.buyer_id === sel.id && ["held", "completed"].includes(t.status)).reduce((s, t) => s + Number(t.amount), 0))}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Earned (net)</dt><dd>{money(data!.transactions.filter((t) => t.seller_id === sel.id && t.status === "completed").reduce((s, t) => s + Number(t.seller_amount), 0))}</dd></div>{sel.bio && <p className="pt-2 text-muted-foreground">{sel.bio}</p>}</dl></>}</DialogContent></Dialog>
  </>;
}
