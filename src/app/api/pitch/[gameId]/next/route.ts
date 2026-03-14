export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { notifyUser } from "@/lib/telegram";

// POST /api/pitch/:gameId/next - move to next speaker
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

    // Get current session
    const { data: session } = await supabase
      .from("pitch_sessions")
      .select("*, current_speaker:game_participants!current_speaker_id(id, pitch_order)")
      .eq("game_id", params.gameId)
      .single();

    if (!session) return NextResponse.json({ error: "No pitch session" }, { status: 404 });

    const currentOrder = session.current_speaker?.pitch_order || 0;

    // Mark current speaker as done
    if (session.current_speaker_id) {
      await supabase
        .from("game_participants")
        .update({ pitch_status: "done" })
        .eq("id", session.current_speaker_id);
    }

    // Get next speaker
    const { data: nextSpeaker } = await supabase
      .from("game_participants")
      .select("id, pitch_order")
      .eq("game_id", params.gameId)
      .eq("pitch_status", "waiting")
      .eq("checked_in", true)
      .gt("pitch_order", currentOrder)
      .order("pitch_order", { ascending: true })
      .limit(1)
      .single();

    if (nextSpeaker) {
      // Move to next
      await supabase
        .from("pitch_sessions")
        .update({
          current_speaker_id: nextSpeaker.id,
          speaker_started_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      await supabase
        .from("game_participants")
        .update({ pitch_status: "active" })
        .eq("id", nextSpeaker.id);

      // Notify next speaker via Telegram (fire-and-forget)
      const { data: participant } = await supabase
        .from("game_participants")
        .select("user:users!user_id(telegram_id)")
        .eq("id", nextSpeaker.id)
        .single();
      const tgId = (participant?.user as unknown as { telegram_id: number })?.telegram_id;
      if (tgId) {
        notifyUser(tgId, "🎤 <b>Твоя очередь!</b>\n\nИди к микрофону — сейчас твой питч.").catch(() => {});
      }

      return NextResponse.json({ status: "next", speakerId: nextSpeaker.id });
    } else {
      // No more speakers, finish session
      await supabase
        .from("pitch_sessions")
        .update({
          status: "done",
          current_speaker_id: null,
        })
        .eq("id", session.id);

      return NextResponse.json({ status: "done" });
    }
  } catch (error) {
    console.error("Next pitch error:", error);
    return NextResponse.json({ error: "Failed to advance pitch" }, { status: 500 });
  }
}
