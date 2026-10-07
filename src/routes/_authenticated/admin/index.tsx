import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/hooks/use-admin";
import { ListSkeleton, PageHeader, Stat } from "@/components/bits";
import { money } from "@/lib/market";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/admin/")({ head: () => pageHead("Admin overview", "Platform metrics for AgentDeal."), component: Overview });

function Overview() {
  const { data, isLoading, error } = useAdmin();
  if (isLoading) return <ListSkeleton rows={4} />;
  if (error || !data) return <p className="text-destructive">{error?.message}</p>;
  const roleOf = (r: string) => data.roles.filter((x) => x.role === r).length;
  const paid = data.transactions.filter((t) => t.status === "held" || t.status === "completed");
  const revenue = data.transactions.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.platform_fee), 0);
  const heldAmt = data.transactions.filter((t) => t.status === "held").reduce((s, t) => s + Number(t.amount), 0);
  const active = data.requests.filter((r) => ["negotiating", "in_escrow", "delivered"].includes(r.status)).length;
  const completed = data.requests.filter((r) => r.status === "completed").length;
  return <><PageHeader title="Overview" subtitle="Platform health at a glance." />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Total users" value={data.profiles.length} hint={`${roleOf("buyer")} buyers · ${roleOf("seller")} sellers`} />
      <Stat label="Total requests" value={data.requests.length} />
      <Stat label="Paid transactions" value={paid.length} />
      <Stat label="Platform revenue" value={money(revenue)} hint="7% of released payments" />
      <Stat label="Held right now" value={money(heldAmt)} />
      <Stat label="Active jobs" value={active} />
      <Stat label="Completed jobs" value={completed} />
      <Stat label="Sellers listed" value={data.agents.length} hint={`${data.agents.filter((a) => a.is_demo).length} demo`} />
    </div></>;
}
