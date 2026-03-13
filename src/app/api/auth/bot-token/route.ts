import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createJWT } from "@/lib/auth";

// POST /api/auth/bot-token — generate a login token
export async function POST() {
  try {
    const token = crypto.randomUUID();
    const supabase = createServerClient();

    await supabase.from("auth_tokens").insert({
      token,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Generate token error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET /api/auth/bot-token?token=xxx — check if token was confirmed
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

    const supabase = createServerClient();

    const { data } = await supabase
      .from("auth_tokens")
      .select("telegram_id, confirmed_at, expires_at")
      .eq("token", token)
      .single();

    if (!data) return NextResponse.json({ status: "not_found" }, { status: 404 });

    // Expired?
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ status: "expired" });
    }

    // Not confirmed yet
    if (!data.confirmed_at || !data.telegram_id) {
      return NextResponse.json({ status: "pending" });
    }

    // Confirmed — get or create user
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", data.telegram_id)
      .single();

    if (!user) {
      return NextResponse.json({ status: "error", error: "User not found" }, { status: 404 });
    }

    // Clean up used token
    await supabase.from("auth_tokens").delete().eq("token", token);

    const jwt = createJWT({ userId: user.id, telegramId: user.telegram_id, role: user.role });

    return NextResponse.json({ status: "confirmed", token: jwt, user });
  } catch (error) {
    console.error("Check token error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
