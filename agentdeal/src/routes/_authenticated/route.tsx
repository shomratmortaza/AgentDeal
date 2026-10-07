import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAccount } from "@/hooks/use-account";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { data, isLoading, error } = useAccount();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const needsRole = data && !data.role && !data.isAdmin;
  useEffect(() => { if (needsRole && path !== "/onboarding") navigate({ to: "/onboarding", replace: true }); }, [needsRole, path, navigate]);
  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4 p-12"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;
  if (error) return <div className="p-12 text-sm text-destructive">{error.message}</div>;
  if (path === "/onboarding") return <Outlet />;
  return <AppShell><Outlet /></AppShell>;
}
