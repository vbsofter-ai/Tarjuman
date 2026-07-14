import { NextResponse } from "next/server";
import { getFeedback, isSuperAdmin } from "@/src/lib/server-db";

export async function GET(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const feedbacks = await getFeedback();
    return NextResponse.json(feedbacks);
  } catch (error: any) {
    console.error("Admin Feedback GET API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
