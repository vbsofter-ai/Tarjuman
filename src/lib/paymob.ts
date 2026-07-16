/**
 * Paymob Payment Gateway Integration Service
 * https://docs.paymob.com/
 *
 * This service wraps the three Paymob API calls required to render the
 * hosted payment iframe:
 *   1. Authentication Request  → obtain an `auth_token`
 *   2. Order Registration API  → obtain a Paymob `order_id` for our internal payment id
 *   3. Payment Key Request     → obtain a single-use `payment_token` for the iframe
 *
 * After payment, Paymob will POST a server-to-server "Transaction
 * Processed" callback to /api/billing/callback containing an HMAC we
 * must verify before crediting the user.
 */
import { createHmac, timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PAYMOB_API_BASE = "https://accept.paymob.com/api";
const PAYMOB_IFRAME_BASE = "https://accept.paymob.com/api/acceptance/iframes";

interface PaymobConfig {
  apiKey: string;
  integrationIdCard: number;     // Online Card integration (required for iframe flow)
  iframeId: number;              // Public iframe id (embedded into checkout URL)
  hmacSecret: string;            // Used to verify webhook signatures
  publicBaseUrl: string;         // Where Paymob will redirect the user after payment
  apiBase: string;               // Override only for testing (Paymob's staging has the same URL)
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function loadConfig(): PaymobConfig {
  const apiKey = process.env.PAYMOB_API_KEY || "";
  // Default to the in-store integration id when an online card id is not set
  // (the .env ships with InStore=5738501 and Tap=5738500; online card must
  //  be added in the merchant dashboard under Developers → Payment Integrations).
  const integrationIdCard = parseInt(
    process.env.PAYMOB_INTEGRATION_ID_CARD || process.env.PAYMOB_INTEGRATION_ID_INSTORE || "5738501",
    10
  );
  const iframeId = parseInt(process.env.PAYMOB_IFRAME_ID || "1002380", 10);
  const hmacSecret = process.env.PAYMOB_HMAC || "";
  // Resolve a usable base URL. AI Studio templates ship with
  // `APP_URL="MY_APP_URL"` as a placeholder — fall back to localhost in dev.
  const rawBaseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "";
  const isPlaceholder = !rawBaseUrl || /MY_APP_URL|REPLACE_ME|CHANGEME|placeholder/i.test(rawBaseUrl);
  const publicBaseUrl = isPlaceholder
    ? "http://localhost:3004"
    : rawBaseUrl.replace(/\/+$/, "");

  return {
    apiKey,
    integrationIdCard,
    iframeId,
    hmacSecret,
    publicBaseUrl,
    apiBase: PAYMOB_API_BASE,
  };
}

export function getPaymobPublicConfig() {
  const cfg = loadConfig();
  return {
    iframeId: cfg.iframeId,
    isConfigured: Boolean(cfg.apiKey && cfg.iframeId && cfg.hmacSecret),
  };
}

// ---------------------------------------------------------------------------
// API Key decoding
// ---------------------------------------------------------------------------
//
// Paymob's "API Key" field in the merchant dashboard is the BASE64 of the
// full JSON object. Many merchants (and this project's .env) store the
// base64 string. Paymob also accepts the raw JSON string. We support both.

function extractApiKey(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // JSON object: starts with '{'
  if (trimmed.startsWith("{")) return trimmed;
  // base64 → JSON → take the "api_key" field
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
    const obj = JSON.parse(decoded);
    if (obj && typeof obj.api_key === "string") return obj.api_key;
  } catch {
    // Not base64 / not JSON — fall through and use as-is.
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Step 1 — Authentication
// ---------------------------------------------------------------------------

export async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const cfg = loadConfig();
  const apiKey = extractApiKey(cfg.apiKey);
  if (!apiKey) {
    throw new Error("PAYMOB_API_KEY is not configured");
  }
  const res = await fetch(`${cfg.apiBase}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob auth failed: ${res.status} ${text}`);
  }
  const data: any = await res.json();
  if (!data?.token) {
    throw new Error("Paymob auth response did not include a token");
  }
  // Paymob tokens live ~1 hour; cache for 50 minutes to be safe.
  cachedToken = { token: data.token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.token;
}

// ---------------------------------------------------------------------------
// Step 2 — Order Registration
// ---------------------------------------------------------------------------

export interface RegisterOrderInput {
  merchantOrderId: string;       // our internal payment id (string ≤ 50 chars)
  amountCents: number;           // smallest currency unit (piasters/halalas/cents)
  currency: string;              // "EGP" | "USD" | ...
}

export async function registerOrder(input: RegisterOrderInput): Promise<number> {
  const cfg = loadConfig();
  const authToken = await getAuthToken();
  const res = await fetch(`${cfg.apiBase}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: input.amountCents,
      currency: input.currency,
      merchant_order_id: input.merchantOrderId,
      items: [],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob order registration failed: ${res.status} ${text}`);
  }
  const data: any = await res.json();
  if (!data?.id) {
    throw new Error("Paymob order registration did not return an id");
  }
  return data.id as number;
}

// ---------------------------------------------------------------------------
// Step 3 — Payment Key Request
// ---------------------------------------------------------------------------

export interface PaymentKeyInput {
  orderId: number;
  amountCents: number;
  currency: string;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city?: string;
    country?: string;
    state?: string;
  };
}

export async function getPaymentKey(input: PaymentKeyInput): Promise<string> {
  const cfg = loadConfig();
  const authToken = await getAuthToken();
  const res = await fetch(`${cfg.apiBase}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: input.amountCents,
      currency: input.currency,
      order_id: input.orderId,
      integration_id: cfg.integrationIdCard,
      billing_data: {
        first_name: input.billingData.first_name || input.user.firstName || "User",
        last_name: input.billingData.last_name || input.user.lastName || "Customer",
        email: input.billingData.email || input.user.email,
        phone_number: input.billingData.phone_number || input.user.phone || "01000000000",
        city: input.billingData.city || "Cairo",
        country: input.billingData.country || "EG",
        state: input.billingData.state || "Cairo",
        street: "NA",
        building: "NA",
        floor: "NA",
        apartment: "NA",
        postal_code: "NA",
      },
      // Lock to the card integration for online checkout
      lock_order_when_paid: true,
      // Expire the key after 60 minutes
      expiration: 3600,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob payment key request failed: ${res.status} ${text}`);
  }
  const data: any = await res.json();
  if (!data?.token) {
    throw new Error("Paymob payment key response did not include a token");
  }
  return data.token as string;
}

// ---------------------------------------------------------------------------
// Build iframe URL
// ---------------------------------------------------------------------------

export function buildIframeUrl(paymentToken: string): string {
  const cfg = loadConfig();
  return `${PAYMOB_IFRAME_BASE}/${cfg.iframeId}?payment_token=${encodeURIComponent(paymentToken)}`;
}

// ---------------------------------------------------------------------------
// Full checkout pipeline (used by /api/billing/checkout)
// ---------------------------------------------------------------------------

export interface CreateCheckoutInput {
  internalPaymentId: string;
  amountCents: number;
  currency: string;
  user: { email: string; firstName?: string; lastName?: string; phone?: string };
}

export interface CreateCheckoutResult {
  paymobOrderId: number;
  paymentToken: string;
  iframeUrl: string;
}

export async function createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const cfg = loadConfig();
  if (!cfg.apiKey || !cfg.hmacSecret) {
    throw new Error("Paymob is not configured. Set PAYMOB_API_KEY and PAYMOB_HMAC in .env");
  }
  const paymobOrderId = await registerOrder({
    merchantOrderId: input.internalPaymentId,
    amountCents: input.amountCents,
    currency: input.currency,
  });
  const paymentToken = await getPaymentKey({
    orderId: paymobOrderId,
    amountCents: input.amountCents,
    currency: input.currency,
    user: input.user,
    billingData: {
      first_name: input.user.firstName || "User",
      last_name: input.user.lastName || "Customer",
      email: input.user.email,
      phone_number: input.user.phone || "01000000000",
      city: "Cairo",
      country: "EG",
    },
  });
  return {
    paymobOrderId,
    paymentToken,
    iframeUrl: buildIframeUrl(paymentToken),
  };
}

// ---------------------------------------------------------------------------
// HMAC verification for incoming webhooks / transaction callbacks
// ---------------------------------------------------------------------------

/**
 * Paymob constructs the HMAC over the following fields, concatenated in this
 * exact order, using the secret found in Dashboard → Developers → HMAC.
 *
 *   amount_cents
 *   created_at
 *   currency
 *   error_occured
 *   has_parent_transaction
 *   id
 *   integration_id
 *   is_3d_secure
 *   is_auth
 *   is_capture
 *   is_refunded
 *   is_standalone_payment
 *   is_voided
 *   order.id
 *   owner
 *   pending
 *   source_data.pan
 *   source_data.sub_type
 *   source_data.type
 *   success
 *
 * `obj.cents` etc. are accepted as fallbacks because Paymob's docs have used
 * either spelling in their examples.
 */
export interface PaymobTransactionCallback {
  obj?: Record<string, any>;
  type?: string;
  [key: string]: any;
}

function getField(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    const v = k.split(".").reduce((acc: any, part) => (acc == null ? acc : acc[part]), obj);
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
}

export function verifyPaymobHmac(payload: PaymobTransactionCallback): boolean {
  const cfg = loadConfig();
  if (!cfg.hmacSecret) return false;
  const obj = payload.obj || payload;
  const fields = [
    getField(obj, "amount_cents", "cents"),
    getField(obj, "created_at"),
    getField(obj, "currency"),
    getField(obj, "error_occured", "error_occurred"),
    getField(obj, "has_parent_transaction"),
    getField(obj, "id"),
    getField(obj, "integration_id"),
    getField(obj, "is_3d_secure"),
    getField(obj, "is_auth"),
    getField(obj, "is_capture"),
    getField(obj, "is_refunded"),
    getField(obj, "is_standalone_payment"),
    getField(obj, "is_voided"),
    getField(obj, "order.id"),
    getField(obj, "owner"),
    getField(obj, "pending"),
    getField(obj, "source_data.pan"),
    getField(obj, "source_data.sub_type"),
    getField(obj, "source_data.type"),
    getField(obj, "success"),
  ];
  const concatenated = fields.join("");
  // Paymob uses HMAC-SHA512 and the comparison is case-insensitive on hex.
  const computed = createHmac("sha512", cfg.hmacSecret)
    .update(concatenated)
    .digest("hex")
    .toLowerCase();
  const provided = String(payload.hmac || "").toLowerCase();
  if (!provided) return false;
  try {
    return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers exposed for routes
// ---------------------------------------------------------------------------

export function getReturnUrls() {
  const cfg = loadConfig();
  return {
    success: `${cfg.publicBaseUrl}/billing/success`,
    cancel: `${cfg.publicBaseUrl}/billing/cancel`,
  };
}

export function isPaymobConfigured(): boolean {
  const cfg = loadConfig();
  return Boolean(cfg.apiKey && cfg.hmacSecret && cfg.iframeId);
}
