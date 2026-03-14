export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/pitch/:gameId/start - start or resume pitch session
export async function POST(req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Check organizer
    const { data: game } = await supabase
      .from("games")
      .select("organizer_id")
      .eq("id", params.gameId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (game.organizer_id !== auth.userId && user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get or create session
    let { data: session } = await supabase
      .from("pitch_sessions")
      .select("*")
      .eq("game_id", params.gameId)
      .single();

    if (!session) {
      // Get first participant
      const { data: firstSpeaker } = await supabase
        .from("game_participants")
        .select("id")
        .eq("game_id", params.gameId)
        .eq("checked_in", true)
        .order("pitch_order", { ascending: true })
        .limit(1)
        .single();

      const { data: newSession, error } = await supabase
        .from("pitch_sessions")
        .insert({
          game_id: params.gameId,
          status: "active",
          current_speaker_id: firstSpeaker?.id || null,
          speaker_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      session = newSession;

      // Update first speaker status
      if (firstSpeaker) {
        await supabase
          .from("game_participants")
          .update({ pitch_status: "active" })
          .eq("id", firstSpeaker.id);
      }
    } else {
      // Resume session
      await supabase
        .from("pitch_sessions")
        .update({
          status: "active",
          speaker_started_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Start pitch error:", error);
    return NextResponse.json({ error: "Failed to start pitch" }, { status: 500 });
  }
}
