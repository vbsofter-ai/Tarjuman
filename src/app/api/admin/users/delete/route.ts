import { NextResponse } from "next/server";
import { getUsers, deleteUser, logAction, isSuperAdmin } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const adminEmail = req.headers.get("x-admin-email");
    if (!adminEmail || !(await isSuperAdmin(adminEmail))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;
    const usersListBefore = (await getUsers()) as any[];
    const deletedUser = usersListBefore.find((u: any) => u.id === id);
    const deletedEmail = deletedUser ? deletedUser.email : id;

    // Safeguard: Do not allow deleting super admins
    if (deletedUser && deletedUser.role === "super_admin") {
      return NextResponse.json({ error: "Cannot delete a Super Admin account" }, { status: 400 });
    }

    await deleteUser(id);
    await logAction("User Deleted", "warning", `Admin deleted user account: ${deletedEmail}`);
    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin deleteUser API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
