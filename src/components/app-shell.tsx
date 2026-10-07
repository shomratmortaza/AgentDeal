import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutGrid, Plus, Receipt, Wallet, Store, Shield, Moon, Sun, LogOut, Menu, X, Users, FileText, Settings, Network, UserRound, MessageCircle, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/logo";

type Item = { to: string; label: string; icon: typeof LayoutGrid; exact?: boolean };

export function AppShell({ children }: { children: ReactNode }) {
  const { data: account } = useAccount();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate(); const qc = useQueryClient();
  const [dark, setDark] = useState(false); const [open, setOpen] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  useEffect(() => { setOpen(false); }, [path]);

  const items: Item[] = [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }];
  if (account && account.role !== "seller") items.push({ to: "/new", label: "New request", icon: Plus });
  if (account?.role === "buyer") items.push({ to: "/transactions", label: "Transactions", icon: Receipt });
  if (account?.role === "seller") items.push({ to: "/listing", label: "My listings", icon: Store }, { to: "/earnings", label: "Earnings", icon: Wallet }, { to: "/transactions", label: "Transactions", icon: Receipt });
  items.push({ to: "/messages", label: "Messages", icon: MessageCircle }, { to: "/sellers", label: "Sellers", icon: Network });
  const adminItems: Item[] = account?.isAdmin ? [
    { to: "/admin", label: "Overview", icon: Shield, exact: true }, { to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/requests", label: "Requests", icon: FileText },
    { to: "/admin/transactions", label: "Transactions", icon: Receipt }, { to: "/admin/sellers", label: "Sellers", icon: Store }, { to: "/admin/support", label: "Support inbox", icon: LifeBuoy }, { to: "/admin/settings", label: "Settings", icon: Settings },
  ] : [];

  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };
  const link = (i: Item) => { const active = i.exact ? path === i.to : path === i.to || path.startsWith(i.to + "/"); return <Link key={i.to} to={i.to} aria-current={active ? "page" : undefined} className={cn("nav-item flex h-9 items-center gap-3 rounded-[10px] px-3 text-[13.5px] transition-colors", active ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-card/70 hover:text-foreground")}><i.icon className={cn("size-[17px]", active && "text-signal")} strokeWidth={active ? 2.2 : 1.8} />{i.label}</Link>; };

  const nav = <div className="flex h-full flex-col">
    <div className="px-6 pb-7 pt-7"><Link to="/dashboard"><Wordmark className="w-[128px]" /></Link></div>
    <nav className="space-y-0.5 px-3">{items.map(link)}</nav>
    {adminItems.length > 0 && <><p className="mb-1.5 mt-7 px-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Admin</p><nav className="space-y-0.5 px-3">{adminItems.map(link)}</nav></>}
    <div className="mt-auto p-3">
      <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-left transition-colors hover:bg-card hover:elev-1 data-[state=open]:bg-card" aria-label="Account menu"><span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">{account?.profile?.avatar_url ? <img src={account.profile.avatar_url} alt="" className="size-full object-cover" /> : (account?.profile?.name ?? "··").slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{account?.profile?.name ?? "…"}</p><p className="text-[11px] capitalize text-muted-foreground">{account?.isAdmin ? "Admin" : account?.role ?? ""}{account?.isAdmin && account.role ? ` · ${account.role}` : ""}</p></div></button></DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56"><DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{account?.profile?.email}</DropdownMenuLabel><DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/profile"><UserRound className="size-4" />Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/support"><LifeBuoy className="size-4" />Help & support</Link></DropdownMenuItem>
          {account?.role === "seller" && <DropdownMenuItem asChild><Link to="/listing"><Store className="size-4" />My listings</Link></DropdownMenuItem>}
          {account?.isAdmin && <DropdownMenuItem asChild><Link to="/admin/settings"><Settings className="size-4" />Platform settings</Link></DropdownMenuItem>}
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); const d = !dark; document.documentElement.classList.toggle("dark", d); localStorage.setItem("theme", d ? "dark" : "light"); setDark(d); }}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}{dark ? "Light mode" : "Dark mode"}</DropdownMenuItem>
          <DropdownMenuSeparator /><DropdownMenuItem onSelect={signOut}><LogOut className="size-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div>
  </div>;

  return <div className="workspace-grid">
    <aside className="workspace-sidebar sticky top-0 h-screen">{nav}</aside>
    <div className="min-w-0">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden"><Wordmark className="w-28" /><Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></Button></header>
      {account?.profile?.blocked && <div className="border-b bg-secondary px-6 py-2 text-center text-xs">Your account is blocked. You can view your history but can't start new activity.</div>}
      <main className="workspace-main appear">{children}</main>
    </div>
    {open && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)}><aside className="relative h-full w-64 bg-card" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="absolute right-2 top-5" onClick={() => setOpen(false)} aria-label="Close menu"><X /></Button>{nav}</aside></div>}
  </div>;
}
