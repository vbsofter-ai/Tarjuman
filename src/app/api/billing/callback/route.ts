import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentById,
  getPaymentByPaymobOrderId,
  getPaymentByPaypalOrderId,
  updatePaymentStatus,
  getUserByEmail,
  updateUser,
  logAction,
} from "@/src/lib/server-db";
import { verifyPaymobHmac } from "@/src/lib/paymob";
import { verifyWebhookSignature } from "@/src/lib/paypal";
import { PRICING_PLANS } from "@/src/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/callback
 *
 * Multi-provider webhook endpoint. We auto-detect which gateway the
 * payload came from and route to the right verifier.
 *
 *  - Paymob: HMAC-SHA512 over 19 specific fields
 *            Payload shape: { type: "TRANSACTION", obj: { ... }, hmac: "..." }
 *  - PayPal: webhooks.post POST with { auth_algo, cert_url, ..., webhook_event }
 *            (Only used if the operator configures a webhook URL on PayPal.)
 *            Most PayPal flows are completed via /api/billing/capture-paypal
 *            immediately after the user returns from PayPal's approval flow.
 */

const QUOTA_LIMITS: Record<string, number> = {
  free: 5000,
  pro: 100000,
  enterprise: 9999999,
};

function isPaypalWebhook(payload: any): boolean {
  return Boolean(
    payload?.webhook_event ||
    payload?.event_type ||
    payload?.auth_algo ||
    payload?.transmission_id
  );
}

function isPaymobCallback(payload: any): boolean {
  return Boolean(payload?.hmac || payload?.obj?.order?.merchant_order_id);
}

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ---------------------------------------------------------------------
  // PayPal branch
  // ---------------------------------------------------------------------
  if (isPaypalWebhook(payload)) {
    const ok = await verifyWebhookSignature(payload);
    if (!ok) {
      console.error("[Billing] PayPal webhook signature verification FAILED");
      await logAction("PayPal Webhook Verification Failed", "error", "Rejected PayPal webhook — invalid signature");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const event = payload.webhook_event || payload;
    const eventType: string = event.event_type || event.type || "";
    const resource = event.resource || {};
    const paypalOrderId: string = resource.id || resource.supplementary_data?.related_ids?.order_id || "";
    if (!paypalOrderId) {
      return NextResponse.json({ received: true, ignored: eventType || "no_order_id" });
    }

    const payment = await getPaymentByPaypalOrderId(paypalOrderId);
    if (!payment) {
      return NextResponse.json({ received: true, warning: "no matching payment" });
    }
    if (payment.status === "paid") {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // Handle the event types we care about.
    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
      // For APPROVED, the user is in the process of confirming; the actual
      // capture happens via /api/billing/capture-paypal. We noop here.
      if (eventType === "CHECKOUT.ORDER.APPROVED") {
        return NextResponse.json({ received: true, status: "approved" });
      }
      // PAYMENT.CAPTURE.COMPLETED
      const captureId = resource.id || "";
      const amountStr = resource.amount?.value || "0";
      const amountCents = Math.round(parseFloat(amountStr) * 100);
      const status = resource.status || "COMPLETED";
      if (status !== "COMPLETED") {
        await updatePaymentStatus(payment.id, { status: "failed" });
        return NextResponse.json({ received: true, status });
      }
      await updatePaymentStatus(payment.id, {
        status: "paid",
        paid_at: new Date().toISOString(),
      });
      const { storePaypalIdentifiers } = await import("@/src/lib/server-db");
      await storePaypalIdentifiers(payment.id, { paypal_capture_id: captureId });

      const newQuota = QUOTA_LIMITS[payment.plan_id] || QUOTA_LIMITS.free;
      const user = await getUserByEmail(payment.user_email);
      if (user) {
        await updateUser({
          id: user.id,
          name: user.name,
          email: user.email,
          plan: payment.plan_id as "free" | "pro" | "enterprise",
          quotaUsed: user.quotaUsed,
          quotaLimit: newQuota,
          status: user.status,
          role: user.role,
          permissions: user.permissions,
        });
        await logAction(
          "Subscription Plan Upgraded (PayPal Webhook)",
          "success",
          `User ${payment.user_email} upgraded to ${payment.plan_id} via PayPal webhook (capture ${captureId}, ${amountCents} cents)`
        );
      }
      return NextResponse.json({ received: true, status: "paid" });
    }
    if (eventType === "CHECKOUT.ORDER.CANCELLED" || eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REFUNDED") {
      await updatePaymentStatus(payment.id, { status: "failed" });
      await logAction(
        "PayPal Payment Cancelled/Failed",
        "warning",
        `User ${payment.user_email} PayPal event ${eventType} for order ${paypalOrderId}`
      );
      return NextResponse.json({ received: true, status: eventType });
    }
    return NextResponse.json({ received: true, ignored: eventType });
  }

  // ---------------------------------------------------------------------
  // Paymob branch
  // ---------------------------------------------------------------------
  if (isPaymobCallback(payload)) {
    // 1) HMAC verification — first and most important gate.
    const hmacValid = verifyPaymobHmac(payload);
    if (!hmacValid) {
      console.error("[Billing] Paymob callback HMAC verification FAILED", { type: payload?.type });
      await logAction(
        "Paymob Callback HMAC Failure",
        "error",
        `Rejected callback of type ${payload?.type} — HMAC mismatch.`
      );
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
    }

    const obj = payload.obj || payload;
    const type = String(payload.type || obj.type || "").toUpperCase();

    // Only act on transaction events. (Paymob also sends token callbacks etc.)
    if (type && !type.includes("TRANSACTION")) {
      return NextResponse.json({ received: true, ignored: type });
    }

    // 2) Locate our internal payment record.
    const merchantOrderId = String(obj?.order?.merchant_order_id || "").trim();
    const paymobOrderId = Number(obj?.order?.id || 0);
    let payment =
      (merchantOrderId && (await getPaymentById(merchantOrderId))) ||
      (paymobOrderId ? await getPaymentByPaymobOrderId(paymobOrderId) : null);

    if (!payment) {
      console.warn("[Billing] Paymob callback for unknown payment", { merchantOrderId, paymobOrderId });
      await logAction(
        "Paymob Callback Unmatched",
        "warning",
        `No matching payment for merchant_order_id=${merchantOrderId} / paymob_order_id=${paymobOrderId}`
      );
      return NextResponse.json({ received: true, warning: "no matching payment" });
    }

    if (payment.status === "paid") {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const isSuccess = String(obj.success).toLowerCase() === "true";
    const isPending = String(obj.pending).toLowerCase() === "true";
    const transactionId = Number(obj.id || 0);
    const paidAtIso = isSuccess ? new Date().toISOString() : undefined;

    if (isPending) {
      return NextResponse.json({ received: true, status: "pending" });
    }

    if (!isSuccess) {
      await updatePaymentStatus(payment.id, {
        status: "failed",
        paymob_transaction_id: transactionId || undefined,
        paymob_hmac_verified: 1,
      });
      await logAction(
        "Subscription Payment Failed",
        "error",
        `User ${payment.user_email} payment ${payment.id} failed (txn ${transactionId})`
      );
      return NextResponse.json({ received: true, status: "failed" });
    }

    await updatePaymentStatus(payment.id, {
      status: "paid",
      paymob_transaction_id: transactionId || undefined,
      paymob_hmac_verified: 1,
      paid_at: paidAtIso,
    });

    const newQuota = QUOTA_LIMITS[payment.plan_id] || QUOTA_LIMITS.free;
    const user = await getUserByEmail(payment.user_email);
    if (!user) {
      await logAction(
        "Subscription Upgrade Failed (User Missing)",
        "error",
        `Payment ${payment.id} succeeded but user ${payment.user_email} not found.`
      );
      return NextResponse.json({ received: true, error: "user not found" }, { status: 200 });
    }
    await updateUser({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: payment.plan_id as "free" | "pro" | "enterprise",
      quotaUsed: user.quotaUsed,
      quotaLimit: newQuota,
      status: user.status,
      role: user.role,
      permissions: user.permissions,
    });
    await logAction(
      "Subscription Plan Upgraded",
      "success",
      `User ${payment.user_email} upgraded to ${payment.plan_id} (${payment.billing_period}, ${payment.amount_cents} ${payment.currency}, txn ${transactionId})`
    );
    return NextResponse.json({ received: true, status: "paid", paymentId: payment.id });
  }

  // Unknown payload shape
  console.warn("[Billing] callback with unrecognized shape", { keys: Object.keys(payload || {}) });
  return NextResponse.json({ error: "Unrecognized callback payload" }, { status: 400 });
}

/**
 * GET handler for sanity checks (and for Paymob's "post-callback" health probes).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/billing/callback",
    expects: "POST application/json with Paymob or PayPal webhook payload",
  });
}
