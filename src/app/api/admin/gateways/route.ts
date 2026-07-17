import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/src/lib/server-db";
import { isPaypalConfigured, getPaypalPublicConfig } from "@/src/lib/paypal";
import { isPaymobConfigured, getPaymobPublicConfig } from "@/src/lib/paymob";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/gateways?adminEmail=<super>
 *
 * Returns the runtime mode + configuration of every payment gateway and
 * the AI engine. The admin UI uses this to render the "Sandbox / Live"
 * badge dynamically instead of hardcoding it.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminEmail = (searchParams.get("adminEmail") || "").trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json({ error: "adminEmail is required" }, { status: 400 });
  }
  const ok = await isSuperAdmin(adminEmail);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }

  const paypal = getPaypalPublicConfig();
  const paymob = getPaymobPublicConfig();

  return NextResponse.json({
    paypal: {
      configured: paypal.isConfigured,
      mode: paypal.mode,
      clientIdPreview: paypal.clientId ? `${paypal.clientId.slice(0, 14)}...` : "",
    },
    paymob: {
      configured: paymob.isConfigured,
      iframeId: paymob.iframeId || null,
      // The Paymob dashboard tells the operator whether the iframe is
      // configured for live or test cards. We expose the iframe id only.
    },
    ai: {
      defaultModel: process.env.GEMINI_MODEL || "gemini-flash-latest",
      specializedModel: process.env.GEMINI_SPECIALIZED_MODEL || "gemini-flash-latest",
      seoModel: process.env.SEO_MODEL || "gemini-flash-latest",
      intervalHours: parseInt(process.env.SEO_INTERVAL_HOURS || "24", 10),
    },
  });
}
