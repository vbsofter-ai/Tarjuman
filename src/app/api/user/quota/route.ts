import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getQuotaStatus, getLatestPaymentForUser } from "@/src/lib/server-db";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/quota?email=<user@email.com>
 *
 * Lightweight endpoint for the SPA / pricing page to display the user's
 * current word-usage state. Returns:
 *   {
 *     plan, quotaUsed, quotaLimit, percentUsed,
 *     quotaResetAt, daysUntilReset, wasReset,
 *     lastPayment: { id, plan_id, amount_cents, currency, status, paid_at } | null
 *   }
 *
 * The endpoint also opportunistically resets the user's quota if it is
 * due (so callers never see stale state), and returns `wasReset: true`
 * if it just did.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const status = await getQuotaStatus(email);
  if (!status) {
    return NextResponse.json({ error: "Unable to read quota" }, { status: 500 });
  }

  const lastPayment = await getLatestPaymentForUser(email);

  return NextResponse.json({
    email: user.email,
    name: user.name,
    plan: user.plan,
    quotaUsed: status.quotaUsed,
    quotaLimit: status.quotaLimit,
    percentUsed: status.quotaLimit > 0
      ? Math.min(100, Math.round((status.quotaUsed / status.quotaLimit) * 100))
      : 0,
    quotaResetAt: status.quotaResetAt,
    daysUntilReset: status.daysUntilReset,
    wasReset: status.wasReset,
    lastPayment: lastPayment
      ? {
          id: lastPayment.id,
          plan_id: lastPayment.plan_id,
          billing_period: lastPayment.billing_period,
          amount_cents: lastPayment.amount_cents,
          currency: lastPayment.currency,
          provider: lastPayment.provider,
          status: lastPayment.status,
          paid_at: lastPayment.paid_at,
          created_at: lastPayment.created_at,
        }
      : null,
  });
}
