import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { pageHead } from "@/lib/head";
import { Wordmark } from "@/components/logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "register" } => (s["mode"] === "register" ? { mode: "register" } : {}),
  head: () => pageHead("Sign in", "Sign in or create your AgentDeal account."),
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email").max(255), password: z.string().min(8, "At least 8 characters").max(128) });

function AuthPage() {
  const { mode } = Route.useSearch();
  const register = mode === "register";
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); }); const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/dashboard" }); }); return () => data.subscription.unsubscribe(); }, [navigate]);

  const submit = form.handleSubmit(async ({ email, password }) => {
    setNotice("");
    const res = register ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } }) : await supabase.auth.signInWithPassword({ email, password });
    if (res.error) { toast.error(res.error.message); return; }
    if (!res.data.session) setNotice("Check your inbox to confirm your email, then sign in.");
  });

  return <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="w-full max-w-sm">
      <Link to="/"><Wordmark className="mx-auto w-36" /></Link>
      <h1 className="display mt-12 text-center text-3xl font-semibold">{register ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">{register ? "Start finding better deals in minutes." : "Sign in to continue to AgentDeal."}</p>
      <Button variant="outline" className="mt-10 h-11 w-full rounded-xl" onClick={async () => { const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" }); if (r.error) toast.error(r.error.message); }}>Continue with Google</Button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" className="h-11 rounded-xl" {...form.register("email")} />{form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={register ? "new-password" : "current-password"} className="h-11 rounded-xl" {...form.register("password")} />{form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}</div>
        {notice && <p role="status" className="rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
        <Button disabled={form.formState.isSubmitting} className="h-11 w-full rounded-xl">{form.formState.isSubmitting ? "Please wait…" : register ? "Create account" : "Sign in"}</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">{register ? "Already have an account? " : "New to AgentDeal? "}<Link to="/auth" search={register ? {} : { mode: "register" }} className="font-medium text-primary">{register ? "Sign in" : "Create one"}</Link></p>
    </div>
  </div>;
}
