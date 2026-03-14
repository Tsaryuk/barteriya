export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/games/[id]/catalog — browse all active services in this game
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("game_services")
      .select(`
        *,
        service:services!service_id(
          *,
          owner:users!owner_id(id, first_name, last_name, username, photo_url, phone)
        )
      `)
      .eq("game_id", params.id)
      .eq("is_active", true);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get catalog error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/games/[id]/catalog — add my service to this game
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { serviceId } = body;
    if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });

    const supabase = createServerClient();

    // Verify user owns this service
    const { data: service } = await supabase
      .from("services")
      .select("id, quantity")
      .eq("id", serviceId)
      .eq("owner_id", auth.userId)
      .eq("is_active", true)
      .single();

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    // Verify user is participant of this game
    const { data: participant } = await supabase
      .from("game_participants")
      .select("id")
      .eq("game_id", params.id)
      .eq("user_id", auth.userId)
      .single();

    if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

    const { data, error } = await supabase
      .from("game_services")
      .upsert({
        game_id: params.id,
        service_id: serviceId,
        quantity_remaining: service.quantity,
        is_active: true,
      }, { onConflict: "game_id,service_id" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Add to catalog error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
