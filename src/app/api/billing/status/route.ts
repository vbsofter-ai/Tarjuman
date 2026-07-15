import { NextRequest, NextResponse } from "next/server";
import { getPaymentById, getUserByEmail } from "@/src/lib/server-db";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/status?payment=<id>&email=<email>
 *
 * Used by the /billing/success page to poll for the actual state of a
 * payment. Paymob redirects the user back to the success URL BEFORE the
 * server-to-server callback has necessarily been processed, so we poll
 * briefly until `status === "paid"` or a timeout is reached.
 *
 * Returns: { payment: { id, status, plan_id, billing_period, ... }, user: { plan, ... } | null }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = (searchParams.get("payment") || "").trim();
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  if (!paymentId) {
    return NextResponse.json({ error: "payment id is required" }, { status: 400 });
  }

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Light authorization — the caller must own the payment.
  if (email && payment.user_email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If paid, include the current user snapshot for the success screen.
  const user = payment.status === "paid" ? await getUserByEmail(payment.user_email) : null;

  return NextResponse.json({
    payment: {
      id: payment.id,
      status: payment.status,
      plan_id: payment.plan_id,
      billing_period: payment.billing_period,
      amount_cents: payment.amount_cents,
      currency: payment.currency,
      provider: payment.provider,
      paypal_order_id: payment.paypal_order_id,
      paypal_payer_id: payment.paypal_payer_id,
      paid_at: payment.paid_at,
      updated_at: payment.updated_at,
    },
    user: user
      ? {
          email: user.email,
          name: user.name,
          plan: user.plan,
          quotaUsed: user.quotaUsed,
          quotaLimit: user.quotaLimit,
        }
      : null,
  });
}
