import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ShieldOff } from "lucide-react";
import { useAccount } from "@/hooks/use-account";
import { Empty } from "@/components/bits";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

function AdminLayout() {
  const { data } = useAccount();
  if (!data?.isAdmin) return <Empty icon={ShieldOff} title="Not available" text="This area is restricted." />;
  return <Outlet />;
}
