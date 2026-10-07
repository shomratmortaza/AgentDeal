import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/logo";

export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

/** Public navigation bar; reflects the session. */
export function PublicHeader() {
  const signedIn = useSignedIn();
  return <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-background/70 backdrop-blur-2xl">
    <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link to="/" aria-label="AgentDeal home"><Wordmark className="w-[118px]" /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/sellers" className="rounded-full px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Find sellers</Link>
          <a href="/#how" className="rounded-full px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="/#pricing" className="rounded-full px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
        </nav>
      </div>
      <nav className="flex items-center gap-1.5">
        {signedIn === null ? <span className="w-40" /> : signedIn ? <>
          <Button asChild variant="ghost" size="sm"><Link to="/messages"><MessageCircle className="size-4" />Messages</Link></Button>
          <Button asChild size="sm"><Link to="/dashboard">Dashboard</Link></Button>
        </> : <>
          <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
          <Button asChild size="sm"><Link to="/auth" search={{ mode: "register" }}>Get started</Link></Button>
        </>}
      </nav>
    </div>
  </header>;
}

export function Avatar({ name, src, className = "size-11", demo }: { name?: string | null | undefined; src?: string | null | undefined; className?: string; demo?: boolean }) {
  const initials = (name ?? "··").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`relative flex shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold ${className}`}>
    {src ? <img src={src} alt="" className="size-full rounded-full object-cover" /> : initials}
    {demo && <span className="absolute -bottom-1 -right-1 rounded-full border bg-card px-1 text-[8px] font-medium text-muted-foreground">DEMO</span>}
  </span>;
}
