/**
 * PayPal Subscriptions / Checkout Integration Service
 * https://developer.paypal.com/docs/api/orders/v2/
 *
 * Implements the Orders v2 flow:
 *   1. POST /v1/oauth2/token        (Client Credentials grant) → access_token
 *   2. POST /v2/checkout/orders     → PayPal order id + approval URL
 *   3. POST /v2/checkout/orders/{id}/capture → confirm the payment
 *
 * After approval, PayPal redirects the user back to our returnUrl with
 * `?token=<paypalOrderId>&PayerID=<...>`. The success page then calls
 * /api/billing/capture-paypal which calls capture() and credits the user.
 *
 * For production, set PAYPAL_MODE="live" (or omit to default to sandbox for safety).
 */

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  mode: "sandbox" | "live";
  publicBaseUrl: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function loadConfig(): PayPalConfig {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_SECRET_KEY || "";
  const mode: "sandbox" | "live" = (process.env.PAYPAL_MODE === "live" ? "live" : "sandbox");
  const baseUrl = mode === "live" ? LIVE_BASE : SANDBOX_BASE;
  const publicBaseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3004";
  return {
    clientId,
    clientSecret,
    baseUrl,
    mode,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };
}

export function getPaypalPublicConfig() {
  const cfg = loadConfig();
  return {
    clientId: cfg.clientId,
    mode: cfg.mode,
    isConfigured: Boolean(cfg.clientId && cfg.clientSecret),
  };
}

export function isPaypalConfigured(): boolean {
  const cfg = loadConfig();
  return Boolean(cfg.clientId && cfg.clientSecret);
}

function getReturnUrls() {
  const cfg = loadConfig();
  return {
    success: `${cfg.publicBaseUrl}/billing/success`,
    cancel: `${cfg.publicBaseUrl}/billing/cancel`,
  };
}

// ---------------------------------------------------------------------------
// OAuth — get an access token (Client Credentials)
// ---------------------------------------------------------------------------

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const cfg = loadConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error("PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY in .env");
  }
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(`${cfg.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }
  const data: any = await res.json();
  if (!data?.access_token) {
    throw new Error("PayPal auth response did not include an access_token");
  }
  // PayPal tokens live ~9 hours; cache for 50 minutes to be safe.
  cachedToken = { token: data.access_token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Create order
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  internalPaymentId: string;          // our reference (becomes PayPal `custom` + invoice_id)
  amountCents: number;                // smallest currency unit (USD cents)
  currency: "USD";                   // PayPal is configured for USD only
  description: string;
  user: { email: string; name?: string };
}

export interface CreateOrderResult {
  paypalOrderId: string;
  approvalUrl: string;
  status: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const cfg = loadConfig();
  const accessToken = await getAccessToken();
  const { success: returnUrl, cancel: cancelUrl } = getReturnUrls();

  const amount = (input.amountCents / 100).toFixed(2);
  const fullReturnUrl = `${returnUrl}?payment=${encodeURIComponent(input.internalPaymentId)}&provider=paypal`;
  const fullCancelUrl = `${cancelUrl}?payment=${encodeURIComponent(input.internalPaymentId)}&provider=paypal`;

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: input.internalPaymentId,
        invoice_id: input.internalPaymentId,
        custom: input.internalPaymentId,
        description: input.description,
        amount: {
          currency_code: input.currency,
          value: amount,
          breakdown: {
            item_total: { currency_code: input.currency, value: amount },
          },
        },
        items: [
          {
            name: input.description,
            description: `Tarjuman AI subscription (${input.internalPaymentId})`,
            unit_amount: { currency_code: input.currency, value: amount },
            quantity: "1",
            category: "DIGITAL_GOODS",
          },
        ],
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          brand_name: "Tarjuman AI",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: fullReturnUrl,
          cancel_url: fullCancelUrl,
        },
      },
    },
  };

  const res = await fetch(`${cfg.baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${text}`);
  }
  const data: any = await res.json();
  const paypalOrderId: string = data?.id;
  if (!paypalOrderId) {
    throw new Error("PayPal create order response did not include an id");
  }
  // Find the approval URL in the links
  const approvalLink = (data.links || []).find((l: any) => l.rel === "payer-action" || l.rel === "approve");
  const approvalUrl = approvalLink?.href;
  if (!approvalUrl) {
    throw new Error("PayPal create order response did not include an approval URL");
  }
  return { paypalOrderId, approvalUrl, status: data.status || "CREATED" };
}

// ---------------------------------------------------------------------------
// Capture order (after user approves on PayPal)
// ---------------------------------------------------------------------------

export interface CaptureOrderResult {
  paypalOrderId: string;
  captureId: string;
  status: string;            // "COMPLETED" is what we want
  payerId: string;
  amount: number;            // amount in cents
  currency: string;
}

export async function captureOrder(paypalOrderId: string): Promise<CaptureOrderResult> {
  const cfg = loadConfig();
  const accessToken = await getAccessToken();
  const res = await fetch(`${cfg.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${text}`);
  }
  const data: any = await res.json();
  const purchaseUnit = data?.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  const status: string = data?.status || capture?.status || "UNKNOWN";
  const captureId: string = capture?.id || "";
  const payerId: string = data?.payer?.payer_id || "";
  const currency: string = capture?.amount?.currency_code || purchaseUnit?.amount?.currency_code || "USD";
  const valueStr: string = capture?.amount?.value || purchaseUnit?.amount?.value || "0";
  const amount = Math.round(parseFloat(valueStr) * 100);
  if (!captureId) {
    throw new Error("PayPal capture response did not include a capture id");
  }
  return { paypalOrderId, captureId, status, payerId, amount, currency };
}

// ---------------------------------------------------------------------------
// Webhook verification (optional — used if user configures a webhook URL)
// ---------------------------------------------------------------------------

/**
 * Verify a PayPal webhook signature. PayPal posts:
 *   { auth_algo, cert_url, transmission_id, transmission_sig, transmission_time,
 *     webhook_id, webhook_event: { ... } }
 *
 * We POST the verification payload to PayPal's verify-webhook-signature
 * endpoint and require "SUCCESS" status.
 */
export async function verifyWebhookSignature(payload: any): Promise<boolean> {
  const cfg = loadConfig();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // If no webhook id is configured, we cannot verify. Treat the webhook as
    // unverified so the caller can decide what to do.
    return false;
  }
  const accessToken = await getAccessToken();
  const res = await fetch(`${cfg.baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: payload.auth_algo,
      cert_url: payload.cert_url,
      transmission_id: payload.transmission_id,
      transmission_sig: payload.transmission_sig,
      transmission_time: payload.transmission_time,
      webhook_id: webhookId,
      webhook_event: payload.webhook_event,
    }),
  });
  if (!res.ok) return false;
  const data: any = await res.json();
  return data?.verification_status === "SUCCESS";
}

/**
 * Convert a USD-cents amount into a human-readable description for PayPal.
 * Used as `purchase_units[0].description`.
 */
export function describePlan(planId: string, billingPeriod: "monthly" | "yearly", amountCents: number): string {
  const usd = (amountCents / 100).toFixed(2);
  return `Tarjuman ${planId.toUpperCase()} (${billingPeriod}) — $${usd}`;
}
