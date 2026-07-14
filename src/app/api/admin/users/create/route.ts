import { NextResponse } from "next/server";
import { getUsers, getUserByEmail, createUser, logAction, isSuperAdmin } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, plan, quotaLimit, preferredDomain, role, permissions } = body;
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }
    await createUser({
      id: `usr-${Date.now()}`,
      name,
      email,
      plan,
      quotaLimit,
      preferredDomain,
      role,
      permissions
    });
    await logAction("User Created Manually", "success", `Admin registered user account: ${email} with role: ${role || 'user'}`);
    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin createUser API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
