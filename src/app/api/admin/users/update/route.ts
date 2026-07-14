import { NextResponse } from "next/server";
import { getUsers, updateUser, logAction } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, plan, quotaUsed, quotaLimit, status, role, permissions } = body;
    await updateUser({ id, name, email, plan, quotaUsed, quotaLimit, status, role, permissions });
    await logAction("User Profile Updated", "success", `Modified profile/quota/role for ${email}`);
    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin updateUser API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
