import { NextResponse } from "next/server";
import { addFeedback } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, rating, comment, details } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating value. Must be between 1 and 5." }, { status: 400 });
    }

    await addFeedback(
      email || null,
      rating,
      comment || "",
      details || null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
