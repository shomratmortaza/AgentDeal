import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminData } from "@/lib/market.functions";

export function useAdmin() {
  const fn = useServerFn(adminData);
  return useQuery({ queryKey: ["admin"], queryFn: () => fn() });
}
export function useRefreshAdmin() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ["admin"] }); }
