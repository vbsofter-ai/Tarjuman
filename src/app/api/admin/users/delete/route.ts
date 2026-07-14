import { NextResponse } from "next/server";
import { getUsers, deleteUser, logAction } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    const usersListBefore = (await getUsers()) as any[];
    const deletedUser = usersListBefore.find((u: any) => u.id === id);
    const deletedEmail = deletedUser ? deletedUser.email : id;

    await deleteUser(id);
    await logAction("User Deleted", "warning", `Admin deleted user account: ${deletedEmail}`);
    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin deleteUser API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
