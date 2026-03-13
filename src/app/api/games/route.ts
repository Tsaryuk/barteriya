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
        participants:game_participants(count)
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

    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { data: game, error } = await supabase
      .from("games")
      .insert({
        title: body.title,
        description: body.description,
        location: body.location,
        event_date: body.eventDate,
        max_participants: body.maxParticipants,
        pitch_duration_sec: body.pitchDurationSec || 120,
        ticket_price_rub: body.ticketPriceRub || 0,
        organizer_id: auth.userId,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}
