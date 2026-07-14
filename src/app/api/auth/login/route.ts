import { NextResponse } from "next/server";
import { getUserByEmail, createUser, updateLastActive, logAction } from "@/src/lib/server-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUser({
        id: `usr-${Date.now()}`,
        name: name || email.split("@")[0],
        email: email,
        plan: "free",
        quotaLimit: 5000,
        preferredDomain: "general"
      });
      await logAction("User Registration", "info", `New user registered: ${email}`);
    } else {
      await updateLastActive(email);
      await logAction("User Login", "success", `User logged in: ${email}`);
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Auth API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
