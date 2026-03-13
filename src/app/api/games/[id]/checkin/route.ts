import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/games/[id]/checkin — check-in a participant (by admin/manager or self via QR)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const userId = body.userId || auth.userId;

    const supabase = createServerClient();

    // If checking in someone else, must be admin or manager
    if (userId !== auth.userId) {
      const { data: me } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.userId)
        .single();

      if (!me || (me.role !== "admin" && me.role !== "manager")) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from("game_participants")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("game_id", params.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
