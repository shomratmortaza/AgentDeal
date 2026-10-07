import wordmark from "@/assets/agentdeal-wordmark.png";
import mark from "@/assets/agentdeal-mark.png";
import { cn } from "@/lib/utils";

/** Transparent AgentDeal logo: black in light mode, white in dark mode. */
export function Wordmark({ className }: { className?: string }) {
  return <img src={wordmark} alt="AgentDeal" className={cn("brand-mono h-auto select-none", className)} draggable={false} />;
}
export function Mark({ className }: { className?: string }) {
  return <img src={mark} alt="" className={cn("brand-mono h-auto select-none", className)} draggable={false} />;
}
