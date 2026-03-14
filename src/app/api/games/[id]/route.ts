import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/games/:id - game detail
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { data: game, error } = await supabase
      .from("games")
      .select(`
        *,
        organizer:users!organizer_id(id, first_name, last_name, username),
        participants:game_participants(
          id, balance_b, pitch_order, pitch_status, joined_at,
          user:users(id, first_name, last_name, username, about)
        ),
        pitch_session:pitch_sessions(*)
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json(game);
  } catch (error) {
    console.error("Game detail error:", error);
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}

// PATCH /api/games/:id - update game (organizer/admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const { data: game } = await supabase
      .from("games")
      .select("organizer_id")
      .eq("id", params.id)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // Check ownership
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (game.organizer_id !== auth.userId && user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.location !== undefined) updates.location = body.location;
    if (body.eventDate !== undefined || body.event_date !== undefined) updates.event_date = body.eventDate || body.event_date;
    if (body.status !== undefined) updates.status = body.status;
    if (body.maxParticipants !== undefined || body.max_participants !== undefined) updates.max_participants = body.maxParticipants ?? body.max_participants;
    if (body.pitchDurationSec !== undefined || body.pitch_duration_sec !== undefined) updates.pitch_duration_sec = body.pitchDurationSec ?? body.pitch_duration_sec;
    if (body.ticketPriceRub !== undefined || body.ticket_price_rub !== undefined) updates.ticket_price_rub = body.ticketPriceRub ?? body.ticket_price_rub;
    if (body.bank_open !== undefined) updates.bank_open = body.bank_open;

    const { data: updated, error } = await supabase
      .from("games")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update game error:", error);
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
  }
}

// DELETE /api/games/:id - delete game (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete related data first
    await supabase.from("transactions").delete().eq("game_id", params.id);
    await supabase.from("purchased_certificates").delete().eq("game_id", params.id);
    await supabase.from("game_services").delete().eq("game_id", params.id);
    await supabase.from("pitch_sessions").delete().eq("game_id", params.id);
    await supabase.from("game_participants").delete().eq("game_id", params.id);

    const { error } = await supabase.from("games").delete().eq("id", params.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete game error:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
