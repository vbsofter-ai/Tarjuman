import { NextResponse } from "next/server";
import { getUsers, updateUser, logAction, isSuperAdmin } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, email, plan, quotaUsed, quotaLimit, status, role, permissions } = body;

    const usersListBefore = (await getUsers()) as any[];
    const affectedUser = usersListBefore.find((u: any) => u.id === id);

    // Safeguard: A Super Admin cannot be downgraded by this endpoint unless authorized
    if (affectedUser && affectedUser.role === "super_admin" && role !== "super_admin") {
      // Prevent downgrading the primary super admin
      if (email === "romyatef@gmail.com") {
        return NextResponse.json({ error: "Cannot downgrade the primary Super Admin account" }, { status: 400 });
      }
    }

    await updateUser({ id, name, email, plan, quotaUsed, quotaLimit, status, role, permissions });
    await logAction("User Profile Updated", "success", `Modified profile/quota/role for ${email}`);
    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin updateUser API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
