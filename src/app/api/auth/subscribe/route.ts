import { NextResponse } from "next/server";
import { getUserByEmail, updateUser, logAction } from "@/src/lib/server-db";

/**
 * POST /api/auth/subscribe
 * Body: { email, planId, billingPeriod? }
 *
 * IMPORTANT — paid plans (pro, enterprise) MUST go through the Paymob
 * checkout flow at /api/billing/checkout. This endpoint now REFUSES to
 * upgrade a user to a paid plan without a corresponding paid payment
 * record, to prevent free upgrades.
 *
 * The free plan (downgrade) is still applied directly because no payment
 * is required for it.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planId } = body;

    if (!email || !planId) {
      return NextResponse.json({ error: "Email and planId are required" }, { status: 400 });
    }

    if (!["free", "pro", "enterprise"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Always allow downgrade to free.
    if (planId === "free") {
      const updatedUser = await updateUser({
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
      await logAction(
        "Subscription Downgrade",
        "success",
        `User ${email} switched to free plan (limit 5,000)`
      );
      return NextResponse.json(updatedUser);
    }

    // For paid plans, force the caller to use the Paymob checkout flow.
    // This closes the previous vulnerability where any signed-in user could
    // POST to this endpoint and instantly upgrade to pro/enterprise for free.
    return NextResponse.json(
      {
        error:
          "Paid plans require a verified Paymob payment. Please use /api/billing/checkout to start a payment session.",
        code: "payment_required",
        redirect: "/api/billing/checkout",
      },
      { status: 402 } // 402 Payment Required
    );
  } catch (error: any) {
    console.error("Subscription API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
