import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentByPaypalOrderId,
  getPaymentById,
  updatePaymentStatus,
  getUserByEmail,
  updateUser,
  logAction,
} from "@/src/lib/server-db";
import { captureOrder } from "@/src/lib/paypal";
import { PRICING_PLANS } from "@/src/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/capture-paypal
 * Body: { paymentId, paypalOrderId, payerId }
 *
 * Called by the /billing/success page after PayPal redirects the user back
 * with `?token=<paypalOrderId>&PayerID=<...>`. We hit PayPal's
 * /v2/checkout/orders/{id}/capture endpoint, then if the result is
 * "COMPLETED" we credit the user's subscription.
 *
 * The function is idempotent: a second call on a paid payment just returns
 * the current state without double-charging.
 */

interface UpgradeResult {
  quotaLimits: Record<string, number>;
  apply: (planId: "free" | "pro" | "enterprise") => number;
}

function quotaForPlan(planId: "free" | "pro" | "enterprise"): number {
  const limits: Record<string, number> = { free: 5000, pro: 100000, enterprise: 9999999 };
  return limits[planId] || 5000;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId: string = String(body.paymentId || "").trim();
    const paypalOrderId: string = String(body.paypalOrderId || body.token || "").trim();
    const payerId: string = String(body.payerId || body.PayerID || "").trim();

    if (!paypalOrderId) {
      return NextResponse.json({ error: "paypalOrderId is required" }, { status: 400 });
    }

    // Find the payment row.
    let payment = paymentId ? await getPaymentById(paymentId) : null;
    if (!payment) {
      payment = await getPaymentByPaypalOrderId(paypalOrderId);
    }
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.provider !== "paypal") {
      return NextResponse.json({ error: "Payment is not a PayPal payment" }, { status: 400 });
    }

    // Idempotency: already captured? Just return the current state.
    if (payment.status === "paid") {
      const user = await getUserByEmail(payment.user_email);
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
        payment: { id: payment.id, status: payment.status, plan_id: payment.plan_id },
        user,
      });
    }

    // Store the payer id if we have it.
    if (payerId) {
      await updatePaymentStatus(payment.id, {}); // noop to refresh updated_at is not needed; skip
      // Use the dedicated storePaypalIdentifiers to record the payer id.
      const { storePaypalIdentifiers } = await import("@/src/lib/server-db");
      await storePaypalIdentifiers(payment.id, { paypal_payer_id: payerId });
    }

    // Capture the order with PayPal.
    let capture;
    try {
      capture = await captureOrder(paypalOrderId);
    } catch (err: any) {
      console.error("[Billing] PayPal capture failed:", err);
      await logAction(
        "PayPal Capture Error",
        "error",
        `Capture failed for payment ${payment.id} (PayPal order ${paypalOrderId}): ${err?.message || err}`
      );
      return NextResponse.json(
        { error: "Could not capture the PayPal payment. If your card was charged, your subscription will activate within minutes." },
        { status: 502 }
      );
    }

    // Persist the capture identifiers regardless of final status.
    const { storePaypalIdentifiers } = await import("@/src/lib/server-db");
    await storePaypalIdentifiers(payment.id, {
      paypal_capture_id: capture.captureId,
      paypal_payer_id: capture.payerId || payerId || undefined,
    });

    if (capture.status !== "COMPLETED") {
      // Mark as failed (could be PENDING, DECLINED, etc.)
      await updatePaymentStatus(payment.id, { status: "failed" });
      await logAction(
        "Subscription Payment Failed",
        "error",
        `User ${payment.user_email} payment ${payment.id} PayPal status=${capture.status}`
      );
      return NextResponse.json({ received: true, status: capture.status.toLowerCase() });
    }

    // Sanity check the captured amount matches the expected amount.
    if (capture.amount !== payment.amount_cents) {
      console.warn(
        `[Billing] PayPal capture amount mismatch: expected ${payment.amount_cents} cents, got ${capture.amount} cents`
      );
      // We still proceed — the order was created with the correct amount and
      // PayPal can't capture a different amount at this stage. We just log it.
    }

    // Credit the user.
    const paidAt = new Date().toISOString();
    await updatePaymentStatus(payment.id, {
      status: "paid",
      paid_at: paidAt,
    });

    const newQuota = quotaForPlan(payment.plan_id);
    const user = await getUserByEmail(payment.user_email);
    if (!user) {
      await logAction(
        "Subscription Upgrade Failed (User Missing)",
        "error",
        `PayPal payment ${payment.id} succeeded but user ${payment.user_email} not found.`
      );
      return NextResponse.json({ received: true, status: "paid", error: "user not found" }, { status: 200 });
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
      "Subscription Plan Upgraded (PayPal)",
      "success",
      `User ${payment.user_email} upgraded to ${payment.plan_id} (${payment.billing_period}, ${payment.amount_cents} ${payment.currency}, capture ${capture.captureId})`
    );

    return NextResponse.json({
      received: true,
      status: "paid",
      paymentId: payment.id,
      captureId: capture.captureId,
      user: {
        email: user.email,
        name: user.name,
        plan: payment.plan_id,
        quotaUsed: user.quotaUsed,
        quotaLimit: newQuota,
      },
    });
  } catch (error: any) {
    console.error("[Billing] capture-paypal API error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
