import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CONSENT_KEY = "agentdeal_cookie_consent";
export type Consent = { necessary: true; analytics: boolean; decidedAt: string };

export function readConsent(): Consent | null { try { return JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null"); } catch { return null; } }
export function saveConsent(analytics: boolean) {
  const c: Consent = { necessary: true, analytics, decidedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); window.dispatchEvent(new Event("cookie-consent")); return c;
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { const sync = () => setShow(!readConsent()); sync(); window.addEventListener("cookie-consent", sync); return () => window.removeEventListener("cookie-consent", sync); }, []);
  if (!show) return null;
  return <div role="dialog" aria-live="polite" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Cookie className="hidden size-6 shrink-0 text-signal sm:block" />
      <p className="flex-1 text-sm leading-6 text-muted-foreground">We use essential cookies and local storage to keep you signed in, protect payments and remember your settings. With your permission we also count anonymous visits to seller listings. <Link to="/cookies" className="font-medium text-foreground underline underline-offset-4">Cookie policy</Link></p>
      <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => saveConsent(false)}>Essential only</Button><Button size="sm" onClick={() => saveConsent(true)}>Accept all</Button></div>
    </div>
  </div>;
}
