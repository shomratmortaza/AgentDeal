import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccount } from "@/lib/market.functions";

export function useAccount() {
  const fn = useServerFn(getAccount);
  return useQuery({ queryKey: ["account"], queryFn: () => fn(), staleTime: 60_000 });
}
export type Account = NonNullable<ReturnType<typeof useAccount>["data"]>;
