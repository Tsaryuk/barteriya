import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/certificates?gameId=...&userId=... - list certificates
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const gameId = req.nextUrl.searchParams.get("gameId");
    const supabase = createServerClient();

    let query = supabase
      .from("certificates")
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, username),
        buyer:users!buyer_id(id, first_name, last_name, username)
      `)
      .or(`seller_id.eq.${auth.userId},buyer_id.eq.${auth.userId}`)
      .order("created_at", { ascending: false });

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: certificates, error } = await query;

    if (error) throw error;
    return NextResponse.json(certificates);
  } catch (error) {
    console.error("Certificates list error:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
