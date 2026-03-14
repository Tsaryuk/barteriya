export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/pitch/:gameId - get pitch session status
export async function GET(_req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const supabase = createServerClient();

    const { data: session } = await supabase
      .from("pitch_sessions")
      .select(`
        *,
        current_speaker:game_participants!current_speaker_id(
          id, pitch_order, pitch_status,
          user:users(id, first_name, last_name, username, about)
        )
      `)
      .eq("game_id", params.gameId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "No pitch session" }, { status: 404 });
    }

    // Get queue
    const { data: queue } = await supabase
      .from("game_participants")
      .select(`
        id, pitch_order, pitch_status,
        user:users(id, first_name, last_name, username, about)
      `)
      .eq("game_id", params.gameId)
      .not("pitch_order", "is", null)
      .order("pitch_order", { ascending: true });

    // Get game pitch duration
    const { data: game } = await supabase
      .from("games")
      .select("pitch_duration_sec")
      .eq("id", params.gameId)
      .single();

    return NextResponse.json({
      session,
      queue: queue || [],
      pitchDurationSec: game?.pitch_duration_sec || 120,
    });
  } catch (error) {
    console.error("Pitch session error:", error);
    return NextResponse.json({ error: "Failed to fetch pitch session" }, { status: 500 });
  }
}
