import { NextResponse } from "next/server";
import { getLogs } from "@/src/lib/server-db";

export async function GET() {
  try {
    const logsList = await getLogs();
    return NextResponse.json(logsList);
  } catch (error: any) {
    console.error("Admin getLogs API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
