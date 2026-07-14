import { NextResponse } from "next/server";
import { trackVisit } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { referrer, path } = body;

    // Get client IP address and user-agent
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    await trackVisit(ip.split(",")[0].trim(), userAgent, referrer, path);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Tracking API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
