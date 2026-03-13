import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// PATCH /api/user/profile — update own profile
export async function PATCH(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["about", "phone", "first_name", "last_name"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", auth.userId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
