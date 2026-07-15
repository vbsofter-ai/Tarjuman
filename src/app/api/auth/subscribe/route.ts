import { NextResponse } from "next/server";
import { getUserByEmail, updateUser, logAction } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planId } = body;

    if (!email || !planId) {
      return NextResponse.json({ error: "Email and planId are required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const quotaLimits = {
      free: 5000,
      pro: 100000,
      enterprise: 9999999,
    };

    const newLimit = quotaLimits[planId as keyof typeof quotaLimits];
    if (newLimit === undefined) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const updatedUser = await updateUser({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: planId,
      quotaUsed: user.quotaUsed,
      quotaLimit: newLimit,
      status: user.status,
      role: user.role,
      permissions: user.permissions,
    });

    await logAction("Subscription Plan Upgraded", "success", `User ${email} subscribed to ${planId} plan (Limit: ${newLimit})`);

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Subscription API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
