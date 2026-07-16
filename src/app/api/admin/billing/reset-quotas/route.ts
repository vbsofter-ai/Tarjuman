import { NextRequest, NextResponse } from "next/server";
import { runMonthlyQuotaReset, getQuotaStatus, isSuperAdmin, getUserByEmail, logAction } from "@/src/lib/server-db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/billing/reset-quotas
 * Body: { email?: string }
 * Headers: x-admin-email: <super admin email>
 *
 * Admin-only. If `email` is provided, resets that single user's quota if
 * due. Otherwise, walks the entire `tarjuman_users` table and resets any
 * user whose `quotaResetAt` is in the past.
 *
 * Returns: { reset, total, skipped, message }
 *
 * GET /api/admin/billing/reset-quotas?email=<x>&adminEmail=<super>
 *   Returns the quota status for a single user (no mutation).
 */
export async function POST(req: NextRequest) {
  let payload: any = {};
  try { payload = await req.json(); } catch { /* empty body is fine */ }
  const adminEmail = String(payload.adminEmail || req.headers.get("x-admin-email") || "").trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json({ error: "adminEmail is required" }, { status: 400 });
  }
  const ok = await isSuperAdmin(adminEmail);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }

  const targetEmail: string | undefined = payload.email ? String(payload.email).toLowerCase() : undefined;
  if (targetEmail) {
    const user = await getUserByEmail(targetEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Force reset regardless of schedule.
    const { resetUserQuotaIfDue } = await import("@/src/lib/server-db");
    const reset = await resetUserQuotaIfDue(targetEmail);
    const status = await getQuotaStatus(targetEmail);
    await logAction(
      reset ? "Manual Quota Reset" : "Manual Quota Reset Skipped",
      "info",
      `Admin ${adminEmail} ${reset ? "reset" : "attempted to reset"} quota for ${targetEmail}`
    );
    return NextResponse.json({
      reset,
      message: reset ? "Quota reset successfully" : "Quota not yet due for reset",
      status,
    });
  }

  const result = await runMonthlyQuotaReset();
  await logAction(
    "Monthly Quota Reset",
    "info",
    `Admin ${adminEmail} triggered monthly reset: ${result.reset}/${result.total} users reset, ${result.skipped} skipped (not due yet).`
  );
  return NextResponse.json({
    ...result,
    message: `Reset ${result.reset} of ${result.total} users. ${result.skipped} were not due yet.`,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminEmail = (searchParams.get("adminEmail") || "").toLowerCase();
  const email = (searchParams.get("email") || "").toLowerCase();
  if (!adminEmail || !email) {
    return NextResponse.json({ error: "adminEmail and email are required" }, { status: 400 });
  }
  const ok = await isSuperAdmin(adminEmail);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }
  const status = await getQuotaStatus(email);
  if (!status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(status);
}
