import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { requestStatus, txStatus } from "@/lib/market";

const tone: Record<string, string> = {
  matched: "bg-secondary text-foreground", negotiating: "bg-brand-soft text-primary", in_escrow: "bg-brand-soft text-primary", held: "bg-brand-soft text-primary",
  delivered: "bg-success-soft text-success", completed: "bg-success-soft text-success", cancelled: "bg-secondary text-muted-foreground", refunded: "bg-secondary text-muted-foreground", pending: "bg-secondary text-muted-foreground",
};

export function StatusBadge({ status, kind = "request" }: { status: string; kind?: "request" | "tx" }) {
  const label = (kind === "tx" ? txStatus : requestStatus)[status] ?? status;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", tone[status] ?? "bg-secondary")}>{label}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><h1 className="display text-3xl font-semibold md:text-4xl">{title}</h1>{subtitle && <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>}</div>{action}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div className="rounded-2xl border bg-card p-6 soft-shadow"><p className="text-xs text-muted-foreground">{label}</p><p className="display mt-3 text-3xl font-semibold tabular-nums">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-secondary"><Icon className="size-5 text-muted-foreground" /></span><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>{action && <div className="mt-6">{action}</div>}</div>;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-6 soft-shadow", className)}>{children}</div>;
}

const steps = [
  { key: "paid", label: "Paid" }, { key: "held", label: "Held" }, { key: "delivered", label: "Delivered" }, { key: "confirmed", label: "Confirmed" }, { key: "released", label: "Released" },
];
export function Timeline({ requestStatus: s, txStatus: t }: { requestStatus: string; txStatus?: string | null }) {
  const reached = t === "refunded" ? 0 : s === "completed" ? 5 : s === "delivered" ? 3 : s === "in_escrow" ? 2 : 0;
  return <ol className="flex items-center gap-1">{steps.map((st, i) => { const done = i < reached; return <li key={st.key} className="flex flex-1 flex-col items-center gap-2 text-center"><div className="flex w-full items-center">{<div className={cn("h-px flex-1", i === 0 ? "opacity-0" : done ? "bg-primary" : "bg-border")} />}<span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px]", done ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>{done ? <Check className="size-3" /> : i + 1}</span><div className={cn("h-px flex-1", i === steps.length - 1 ? "opacity-0" : i < reached - 1 ? "bg-primary" : "bg-border")} /></div><span className={cn("text-[11px]", done ? "text-foreground" : "text-muted-foreground")}>{st.label}</span></li>; })}</ol>;
}

export function SellerAvatar({ name, demo }: { name: string; demo?: boolean }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{initials}{demo && <span className="absolute -bottom-1 -right-1 rounded-full border bg-card px-1 text-[8px] font-medium text-muted-foreground">DEMO</span>}</span>;
}
