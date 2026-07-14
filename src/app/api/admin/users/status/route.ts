import { NextResponse } from "next/server";
import { getUsers, updateUserStatus, logAction } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    await updateUserStatus(id, status);
    const usersList = (await getUsers()) as any[];
    const affectedUser = usersList.find((u: any) => u.id === id);
    if (affectedUser) {
      await logAction("User Status Changed", status === "suspended" ? "warning" : "info", `Admin changed status of ${affectedUser.email} to ${status}`);
    }
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin updateStatus API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
