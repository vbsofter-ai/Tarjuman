import { NextResponse } from "next/server";
import { getUsers } from "@/src/lib/server-db";

export async function GET() {
  try {
    const usersList = await getUsers();
    return NextResponse.json(usersList);
  } catch (error: any) {
    console.error("Admin getUsers API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
