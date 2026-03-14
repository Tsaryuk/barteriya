import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/games/:id/join - join a game
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Check game exists and is open
    const { data: game } = await supabase
      .from("games")
      .select("id, status, max_participants")
      .eq("id", params.id)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    if (game.status !== "open") {
      return NextResponse.json({ error: "Game is not open for registration" }, { status: 400 });
    }

    // Check not already joined
    const { data: existing } = await supabase
      .from("game_participants")
      .select("id")
      .eq("game_id", params.id)
      .eq("user_id", auth.userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 });
    }

    // Check max participants
    if (game.max_participants) {
      const { count } = await supabase
        .from("game_participants")
        .select("*", { count: "exact", head: true })
        .eq("game_id", params.id);

      if (count && count >= game.max_participants) {
        return NextResponse.json({ error: "Game is full" }, { status: 400 });
      }
    }

    // Get next pitch order
    const { data: lastParticipant } = await supabase
      .from("game_participants")
      .select("pitch_order")
      .eq("game_id", params.id)
      .order("pitch_order", { ascending: false })
      .limit(1)
      .single();

    const pitchOrder = (lastParticipant?.pitch_order || 0) + 1;

    // Get user's global balance to carry over
    const { data: userData } = await supabase
      .from("users")
      .select("balance_b")
      .eq("id", auth.userId)
      .single();
    const globalBalance = Number(userData?.balance_b) || 0;

    const { data: participant, error } = await supabase
      .from("game_participants")
      .insert({
        game_id: params.id,
        user_id: auth.userId,
        pitch_order: pitchOrder,
        balance_b: globalBalance,
      })
      .select(`*, user:users(id, first_name, last_name, username)`)
      .single();

    if (error) throw error;
    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("Join game error:", error);
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
  }
}
