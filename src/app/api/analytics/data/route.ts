import { NextResponse } from "next/server";
import { getAnalytics, isSuperAdmin } from "@/src/lib/server-db";

export async function GET(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");

    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin credentials required." },
        { status: 403 }
      );
    }

    const analyticsData = await getAnalytics();
    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error("Analytics Data API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
