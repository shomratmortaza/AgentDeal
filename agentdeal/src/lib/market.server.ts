import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./ai/run-id.server.ts";

const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";

async function paypalToken() {
  const id = process.env["PAYPAL_CLIENT_ID"]; const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!id || !secret) throw new Error("PayPal is not configured yet.");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`PayPal sign-in failed: ${body.error_description ?? res.status}`);
  return body.access_token;
}

async function paypal<T>(path: string, init: { method: string; body?: unknown; idempotencyKey?: string }) {
  const token = await paypalToken();
  const res = await fetch(`${PAYPAL_BASE}${path}`, { method: init.method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.idempotencyKey ? { "PayPal-Request-Id": init.idempotencyKey } : {}) }, ...(init.body ? { body: JSON.stringify(init.body) } : {}) });
  const json = (await res.json().catch(() => ({}))) as T & { message?: string; details?: { description?: string }[] };
  if (!res.ok) throw new Error(`PayPal: ${json.details?.[0]?.description ?? json.message ?? res.status}`);
  return json;
}

export function createPaypalOrder(amount: number, currency: string, referenceId: string, description: string) {
  return paypal<{ id: string }>("/v2/checkout/orders", { method: "POST", idempotencyKey: `order-${referenceId}-${crypto.randomUUID()}`, body: { intent: "CAPTURE", purchase_units: [{ reference_id: referenceId, description: description.slice(0, 120), amount: { currency_code: currency, value: amount.toFixed(2) } }] } });
}

export function capturePaypalOrder(orderId: string) {
  return paypal<{ id: string; status: string; purchase_units: { payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] } }[] }>(`/v2/checkout/orders/${orderId}/capture`, { method: "POST", idempotencyKey: `capture-${orderId}` });
}

export function refundPaypalCapture(captureId: string) {
  return paypal<{ id: string; status: string }>(`/v2/payments/captures/${captureId}/refund`, { method: "POST", idempotencyKey: `refund-${captureId}`, body: {} });
}

type Turn = { role: "user" | "assistant"; content: string };

export async function agentText(instructions: string, messages: Turn[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  const run = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: run.fetch });
  try {
    const result = streamText({ model: provider.responses("openai/gpt-6-astra"), maxRetries: 0, instructions, messages, providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } } });
    const text = (await result.text).trim();
    if (!text) throw new Error("The demo seller did not reply. Try again.");
    return text;
  } catch (error) {
    const e = error as { responseBody?: string; message?: string };
    let message = e.message ?? "AI reply failed.";
    try { const b = JSON.parse(e.responseBody ?? "{}"); message = b.message ?? b.error?.message ?? message; } catch { /* keep */ }
    throw new Error(message);
  }
}
