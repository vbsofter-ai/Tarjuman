import { NextResponse } from "next/server";
import { getLogs, isSuperAdmin } from "@/src/lib/server-db";

export async function GET(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const logsList = await getLogs();
    return NextResponse.json(logsList);
  } catch (error: any) {
    console.error("Admin getLogs API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
