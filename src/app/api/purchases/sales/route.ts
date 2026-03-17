export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/purchases/sales — certificates I sold (as seller)
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const gameId = req.nextUrl.searchParams.get("gameId");
    const supabase = createServerClient();

    let query = supabase
      .from("purchased_certificates")
      .select(`
        *,
        service:services!service_id(id, title, description, price_b),
        seller:users!seller_id(id, first_name, last_name, username, photo_url),
        buyer:users!buyer_id(id, first_name, last_name, username, phone, photo_url)
      `)
      .eq("seller_id", auth.userId)
      .order("created_at", { ascending: false });

    if (gameId) query = query.eq("game_id", gameId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get sales error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
