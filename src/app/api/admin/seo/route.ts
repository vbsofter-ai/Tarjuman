import { NextRequest, NextResponse } from "next/server";
import { updateDailySeoAeo } from "@/src/lib/seo-updater";
import { getSystemConfig, isSuperAdmin, logAction } from "@/src/lib/server-db";

export const dynamic = "force-dynamic";

/**
 * Admin SEO / AEO management endpoints.
 *
 *  GET  /api/admin/seo?adminEmail=<super>
 *    → current snapshot: { last_seo_update, last_seo_model, last_seo_tokens_estimated, current }
 *
 *  GET  /api/admin/seo?adminEmail=<super>&history=1
 *    → last 30 SEO snapshots (history ring buffer)
 *
 *  POST /api/admin/seo
 *    body: { adminEmail: string, force?: boolean }
 *    → trigger a fresh SEO/AEO generation
 *
 *  POST /api/admin/seo (rollback)
 *    body: { adminEmail: string, rollback: <snapshot_generatedAt> }
 *    → restore a previous snapshot as the live state
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

  const config = await getSystemConfig();
  const wantHistory = searchParams.get("history") === "1";

  if (wantHistory) {
    const history = Array.isArray(config.seo_history) ? config.seo_history : [];
    return NextResponse.json({
      count: history.length,
      history: history.map((s: any) => ({
        generatedAt: s.generatedAt,
        model: s.model,
        tokensEstimated: s.tokensEstimated,
        seo_title: s.seo_title,
        seo_description: s.seo_description,
        faqCount: Array.isArray(s.seo_faq) ? s.seo_faq.length : 0,
        capabilityCount: Array.isArray(s.aeo_capability_list) ? s.aeo_capability_list.length : 0,
      })),
    });
  }

  return NextResponse.json({
    last_seo_update: config.last_seo_update || null,
    last_seo_model: config.last_seo_model || null,
    last_seo_tokens_estimated: config.last_seo_tokens_estimated || null,
    current: {
      seo_title: config.seo_title || null,
      seo_description: config.seo_description || null,
      seo_keywords: config.seo_keywords || null,
      seo_keyword_strategy: config.seo_keyword_strategy || null,
      seo_faq_count: Array.isArray(config.seo_faq) ? (config.seo_faq as any[]).length : 0,
      aeo_capability_count: Array.isArray(config.aeo_capability_list) ? (config.aeo_capability_list as string[]).length : 0,
      aeo_agent_description_present: Boolean(config.aeo_agent_description),
    },
  });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const adminEmail = String(body.adminEmail || req.headers.get("x-admin-email") || "").trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json({ error: "adminEmail is required" }, { status: 400 });
  }
  const ok = await isSuperAdmin(adminEmail);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }

  // ROLLBACK: restore a previous snapshot.
  if (body.rollback) {
    const target = String(body.rollback);
    const config = await getSystemConfig();
    const history: any[] = Array.isArray(config.seo_history) ? config.seo_history : [];
    const snapshot = history.find((s) => s.generatedAt === target);
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }
    const { updateSystemConfig } = await import("@/src/lib/server-db");
    await updateSystemConfig({
      seo_title: snapshot.seo_title,
      seo_description: snapshot.seo_description,
      seo_keywords: snapshot.seo_keywords,
      seo_keyword_strategy: snapshot.seo_keyword_strategy,
      seo_faq: snapshot.seo_faq,
      aeo_agent_description: snapshot.aeo_agent_description,
      aeo_capability_list: snapshot.aeo_capability_list,
      last_seo_update: snapshot.generatedAt,
      last_seo_model: snapshot.model,
      last_seo_tokens_estimated: snapshot.tokensEstimated || 0,
    });
    await logAction(
      "SEO Rollback",
      "info",
      `Admin ${adminEmail} rolled back SEO/AEO to snapshot from ${snapshot.generatedAt}`
    );
    return NextResponse.json({ ok: true, restored: target });
  }

  // FORCE / TRIGGER a fresh generation.
  const force = body.force !== false; // default true for admin-triggered updates
  const result = await updateDailySeoAeo(force);
  if (!result.ran) {
    return NextResponse.json({ ok: true, ran: false, reason: result.reason || "skipped" });
  }
  const s = result.snapshot;
  return NextResponse.json({
    ok: true,
    ran: true,
    snapshot: {
      generatedAt: s?.generatedAt,
      model: s?.model,
      tokensEstimated: s?.tokensEstimated,
      seo_title: s?.seo_title,
      seo_description: s?.seo_description,
      faqCount: s?.seo_faq?.length || 0,
      capabilityCount: s?.aeo_capability_list?.length || 0,
    },
  });
}
