import { NextRequest, NextResponse } from "next/server";
import { PRICING_PLANS, PlanId, BillingPeriod, PaymentProvider, DEFAULT_PROVIDER } from "@/src/constants";
import {
  createPayment,
  getUserByEmail,
  logAction,
  storePaymobIdentifiers,
  storePaypalIdentifiers,
  updateUser,
} from "@/src/lib/server-db";
import { createCheckoutSession, getReturnUrls, isPaymobConfigured } from "@/src/lib/paymob";
import { createOrder, isPaypalConfigured, describePlan } from "@/src/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout
 * Body: { email, planId, billingPeriod, provider? }
 *   provider: "paymob" | "paypal" (default: paymob)
 *
 * Creates an internal `tarjuman_payments` row in `pending` state, then
 * drives either:
 *   - Paymob three-step flow (auth → order → payment key) → iframe URL
 *   - PayPal Orders v2 flow (auth → create order) → approval URL
 *
 * The user's plan is NOT upgraded here — that only happens once the
 * gateway confirms the payment (Paymob webhook HMAC, or PayPal
 * capture in /api/billing/capture-paypal).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string = String(body.email || "").trim().toLowerCase();
    const planId: PlanId = body.planId;
    const billingPeriod: BillingPeriod = body.billingPeriod === "yearly" ? "yearly" : "monthly";
    const provider: PaymentProvider = body.provider === "paypal" ? "paypal" : DEFAULT_PROVIDER;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!["free", "pro", "enterprise"].includes(planId)) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    // The free plan needs no payment — apply immediately.
    if (planId === "free") {
      const user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const updated = await updateUser({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: "free",
        quotaUsed: user.quotaUsed,
        quotaLimit: 5000,
        status: user.status,
        role: user.role,
        permissions: user.permissions,
      });
      await logAction("Subscription Downgrade", "success", `User ${email} switched to free plan`);
      return NextResponse.json({ applied: true, user: updated });
    }

    // Look up the plan to get the canonical amount for the chosen provider.
    const plan = PRICING_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }
    let amountCents: number;
    let currency: "USD" | "EGP";
    if (provider === "paypal") {
      amountCents = billingPeriod === "monthly" ? plan.amountMonthlyCentsUSD : plan.amountYearlyCentsUSD;
      currency = "USD";
    } else {
      amountCents = billingPeriod === "monthly" ? plan.amountMonthlyCents : plan.amountYearlyCents;
      currency = "EGP";
    }
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "Plan is not purchasable" }, { status: 400 });
    }

    // Provider must be configured on the server.
    if (provider === "paypal" && !isPaypalConfigured()) {
      return NextResponse.json(
        { error: "PayPal is not configured on the server. Please contact support or choose Paymob." },
        { status: 503 }
      );
    }
    if (provider === "paymob" && !isPaymobConfigured()) {
      return NextResponse.json(
        { error: "Paymob is not configured on the server. Please contact support or choose PayPal." },
        { status: 503 }
      );
    }

    // Confirm user exists.
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found. Please sign in first." }, { status: 404 });
    }

    // 1) Reserve a payment record BEFORE calling the gateway so the success
    //    / capture endpoint can correlate back to the right user/plan.
    const internalPaymentId = `tarj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await createPayment({
      id: internalPaymentId,
      user_email: email,
      plan_id: planId,
      billing_period: billingPeriod,
      amount_cents: amountCents,
      currency,
      provider,
      status: "pending",
    });

    // 2) Drive the chosen provider's flow.
    if (provider === "paypal") {
      try {
        const order = await createOrder({
          internalPaymentId,
          amountCents,
          currency: "USD",
          description: describePlan(planId, billingPeriod, amountCents),
          user: { email, name: user.name },
        });
        await storePaypalIdentifiers(internalPaymentId, { paypal_order_id: order.paypalOrderId });
        await logAction(
          "PayPal Checkout Created",
          "info",
          `PayPal order ${order.paypalOrderId} for ${email} → ${planId}/${billingPeriod} (${amountCents} cents USD)`
        );
        return NextResponse.json({
          paymentId: internalPaymentId,
          provider: "paypal",
          paypalOrderId: order.paypalOrderId,
          approvalUrl: order.approvalUrl,
          status: order.status,
        });
      } catch (err: any) {
        console.error("[Billing] PayPal create order failed:", err);
        const paypalMsg = err?.message || String(err);
        await logAction("PayPal Checkout Error", "error", `Failed to create PayPal order for ${email}: ${paypalMsg}`);
        // Surface the actual PayPal error to the client so the operator can
        // see what went wrong, instead of a generic message.
        return NextResponse.json(
          { error: `PayPal error: ${paypalMsg}`, details: paypalMsg },
          { status: 502 }
        );
      }
    }

    // Paymob flow
    try {
      const checkout = await createCheckoutSession({
        internalPaymentId,
        amountCents,
        currency,
        user: {
          email,
          firstName: user.name?.split(" ")[0],
          lastName: user.name?.split(" ").slice(1).join(" ") || "Customer",
        },
      });
      await storePaymobIdentifiers(internalPaymentId, {
        paymob_order_id: checkout.paymobOrderId,
        paymob_payment_token: checkout.paymentToken,
      });
      await logAction(
        "Paymob Checkout Created",
        "info",
        `Paymob order ${checkout.paymobOrderId} for ${email} → ${planId}/${billingPeriod} (${amountCents} ${currency})`
      );
      const { success: baseSuccess, cancel: baseCancel } = getReturnUrls();
      return NextResponse.json({
        paymentId: internalPaymentId,
        provider: "paymob",
        paymobOrderId: checkout.paymobOrderId,
        iframeUrl: checkout.iframeUrl,
        successUrl: `${baseSuccess}?payment=${internalPaymentId}&provider=paymob`,
        cancelUrl: `${baseCancel}?payment=${internalPaymentId}&provider=paymob`,
      });
    } catch (err: any) {
      console.error("[Billing] Paymob checkout creation failed:", err);
      await logAction(
        "Paymob Checkout Error",
        "error",
        `Failed to create Paymob session for ${email} (${planId}/${billingPeriod}): ${err?.message || err}`
      );
      return NextResponse.json(
        { error: "Failed to create payment session. Please try again or contact support." },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("[Billing] Checkout API error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
