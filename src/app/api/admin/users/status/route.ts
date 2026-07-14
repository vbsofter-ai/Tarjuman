import { NextResponse } from "next/server";
import { getUsers, updateUserStatus, logAction, isSuperAdmin } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    const usersListBefore = (await getUsers()) as any[];
    const affectedUser = usersListBefore.find((u: any) => u.id === id);

    // Safeguard: Do not allow suspending super admins
    if (affectedUser && affectedUser.role === "super_admin" && status === "suspended") {
      return NextResponse.json({ error: "Cannot suspend a Super Admin account" }, { status: 400 });
    }

    await updateUserStatus(id, status);
    const usersList = (await getUsers()) as any[];
    if (affectedUser) {
      await logAction("User Status Changed", status === "suspended" ? "warning" : "info", `Admin changed status of ${affectedUser.email} to ${status}`);
    }
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin updateStatus API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
