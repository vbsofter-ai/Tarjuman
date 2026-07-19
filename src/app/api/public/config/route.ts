import { NextResponse } from "next/server";
import { getOpenSourceState, getSystemConfig } from "@/src/lib/server-db";

// Public, no-auth endpoint: returns visitor-facing system flags.
// Currently exposes: openSource (mode + message), maintenance (mode + message).
// Used by /pricing, App.tsx, and other public pages to hide paid plans and quota.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const openSource = await getOpenSourceState();
    const sys = await getSystemConfig();
    const maintenance = {
      enabled: Boolean(sys.maintenanceMode),
      message: String(
        (sys as any).maintenanceMessage ||
          "We are performing scheduled maintenance. Please check back in a few minutes."
      ),
    };
    return NextResponse.json(
      {
        openSource,
        maintenance,
        // Server timestamp helps the client bust caches when admin toggles
        serverTime: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          // Edge cache for 30s; stale-while-revalidate for 5 min
          "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    // Never break the visitor page on a config read failure
    return NextResponse.json(
      {
        openSource: { enabled: false, message: "" },
        maintenance: { enabled: false, message: "" },
        serverTime: new Date().toISOString(),
        error: error?.message || "public config read failed",
      },
      { status: 200 }
    );
  }
}
