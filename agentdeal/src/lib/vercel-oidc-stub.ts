// Stand-in for @vercel/oidc, which the AI SDK gateway bundles but this app never uses
// (we call the Lovable AI Gateway with LOVABLE_API_KEY). The real package uses
// Node's createRequire, which crashes the edge worker on every request.
export class AccessTokenMissingError extends Error {}
export class RefreshAccessTokenFailedError extends Error {}
export function getContext() { return {}; }
export async function getVercelOidcToken() { return ""; }
export function getVercelOidcTokenSync() { return ""; }
export async function getVercelToken(): Promise<string> { throw new Error("Vercel tokens are not used in this app"); }
