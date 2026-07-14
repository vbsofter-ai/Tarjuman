import { NextResponse } from "next/server";
import { getSystemConfig, updateSystemConfig, logAction, isSuperAdmin } from "@/src/lib/server-db";

export async function GET(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const config = await getSystemConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Admin getConfig API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const config = await req.json();
    await updateSystemConfig(config);
    await logAction("System Config Updated", "info", `Admin modified global system parameters`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin updateConfig API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
