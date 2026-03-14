export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/games - list games
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: games, error } = await supabase
      .from("games")
      .select(`
        *,
        organizer:users!organizer_id(id, first_name, last_name, username),
        participants:game_participants(user_id)
      `)
      .order("event_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json(games);
  } catch (error) {
    console.error("Games list error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

// POST /api/games - create game (organizer/admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Check role
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || (user.role !== "organizer" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { data: game, error } = await supabase
      .from("games")
      .insert({
        title: body.title,
        description: body.description,
        location: body.location,
        event_date: body.eventDate || body.event_date,
        max_participants: body.maxParticipants ?? body.max_participants,
        pitch_duration_sec: body.pitchDurationSec || body.pitch_duration_sec || 120,
        ticket_price_rub: body.ticketPriceRub ?? body.ticket_price_rub ?? 0,
        organizer_id: auth.userId,
        status: body.status === "open" ? "open" : "draft",
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add organizer as first participant
    const { data: userData } = await supabase
      .from("users")
      .select("balance_b")
      .eq("id", auth.userId)
      .single();

    await supabase.from("game_participants").insert({
      game_id: game.id,
      user_id: auth.userId,
      pitch_order: 1,
      balance_b: Number(userData?.balance_b) || 0,
      paid: true,
      paid_at: new Date().toISOString(),
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}
