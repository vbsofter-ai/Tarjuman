/**
 * Centralized application URL config.
 *
 * Used everywhere we need a canonical absolute URL (OG tags, PayPal/Paymob
 * return URLs, schema.org markup, sitemap, etc.).
 *
 * Resolution order:
 *   1. process.env.APP_URL (if it looks like a real https://... URL)
 *   2. process.env.NEXT_PUBLIC_APP_URL (same)
 *   3. process.env.NEXTAUTH_URL
 *   4. The well-known production URL (Tarjuman lives at
 *      tarjuman.smarttoolkit.net) — only used as a last resort.
 *
 * The previous behaviour was to fall back to the suspicious
 * "https://tarjuman-ai.portal" placeholder, which leaked into OG tags,
 * schema.org JSON, and PayPal/Paymob return URLs. That placeholder is
 * now NEVER emitted.
 */

const PRODUCTION_URL = "https://tarjuman.smarttoolkit.net";
const DEV_URL = "http://localhost:3004";

function isLikelyRealUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  // Reject obvious placeholders.
  if (/MY_APP_URL|REPLACE_ME|CHANGEME|placeholder|example\.com|\.portal/i.test(v)) {
    return false;
  }
  // Require an http(s) scheme.
  return /^https?:\/\//i.test(v);
}

/**
 * The canonical public origin for this deployment. No trailing slash.
 *
 * Use this for OG/canonical/schema.org tags. DO NOT use it for OAuth
 * callbacks or PayPal/Paymob return URLs if you need an absolute URL
 * with a path — see `getCanonicalUrl()`.
 */
export function getAppOrigin(): string {
  if (isLikelyRealUrl(process.env.APP_URL)) return (process.env.APP_URL as string).replace(/\/+$/, "");
  if (isLikelyRealUrl(process.env.NEXT_PUBLIC_APP_URL)) return (process.env.NEXT_PUBLIC_APP_URL as string).replace(/\/+$/, "");
  if (isLikelyRealUrl(process.env.NEXTAUTH_URL)) return (process.env.NEXTAUTH_URL as string).replace(/\/+$/, "");
  // In development, fall back to the local dev server so OG tags are
  // self-consistent and PayPal/Paymob return URLs are reachable.
  if (process.env.NODE_ENV !== "production") return DEV_URL;
  return PRODUCTION_URL;
}

/**
 * Build a canonical absolute URL for a given path. Trims leading slashes
 * from the path so callers can pass either "/pricing" or "pricing".
 */
export function getCanonicalUrl(path: string = ""): string {
  const base = getAppOrigin();
  if (!path) return base;
  const cleanPath = path.replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}

/**
 * True when running in production with a real public origin. Used to
 * gate behaviour that should only happen in prod (sitemap canonical
 * URLs, structured-data "url" fields, etc.).
 */
export function isProductionOrigin(): boolean {
  const origin = getAppOrigin();
  return origin.startsWith("https://") && !origin.includes("localhost");
}
