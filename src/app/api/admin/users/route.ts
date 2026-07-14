import { NextResponse } from "next/server";
import { getUsers, isSuperAdmin } from "@/src/lib/server-db";

export async function GET(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin getUsers API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
