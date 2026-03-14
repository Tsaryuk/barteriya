export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { notifyUser, escapeHtml } from "@/lib/telegram";
import { formatBarters } from "@/lib/utils";

// GET /api/purchases — my purchased certificates
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
        service:services!service_id(id, title, description, price_b, original_price_rub, expires_days),
        seller:users!seller_id(id, first_name, last_name, username, phone, photo_url)
      `)
      .eq("buyer_id", auth.userId)
      .order("created_at", { ascending: false });

    if (gameId) query = query.eq("game_id", gameId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get purchases error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/purchases — buy a certificate (transfer barters for a game_service)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameId, gameServiceId } = body;

    if (!gameId || !gameServiceId) {
      return NextResponse.json({ error: "gameId and gameServiceId required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get game service with service details
    const { data: gs } = await supabase
      .from("game_services")
      .select("*, service:services!service_id(*)")
      .eq("id", gameServiceId)
      .eq("game_id", gameId)
      .eq("is_active", true)
      .single();

    if (!gs || !gs.service) {
      return NextResponse.json({ error: "Service not available" }, { status: 404 });
    }

    const service = gs.service as { id: string; owner_id: string; title: string; price_b: number; expires_days: number };

    // Can't buy own service
    if (service.owner_id === auth.userId) {
      return NextResponse.json({ error: "Cannot buy your own service" }, { status: 400 });
    }

    // Check quantity
    if (gs.quantity_remaining !== null && gs.quantity_remaining <= 0) {
      return NextResponse.json({ error: "Sold out" }, { status: 400 });
    }

    // Check buyer balance
    const { data: buyerParticipant } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", auth.userId)
      .single();

    if (!buyerParticipant) return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    if (buyerParticipant.balance_b < service.price_b) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Get seller participant
    const { data: sellerParticipant } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", service.owner_id)
      .single();

    if (!sellerParticipant) return NextResponse.json({ error: "Seller not in game" }, { status: 400 });

    // Create transaction
    const { data: transaction, error: txErr } = await supabase
      .from("transactions")
      .insert({
        game_id: gameId,
        from_user_id: auth.userId,
        to_user_id: service.owner_id,
        amount_b: service.price_b,
        type: "transfer",
        note: `Покупка: ${service.title}`,
      })
      .select()
      .single();

    if (txErr) throw txErr;

    // Update balances
    await supabase
      .from("game_participants")
      .update({ balance_b: buyerParticipant.balance_b - service.price_b })
      .eq("id", buyerParticipant.id);

    await supabase
      .from("game_participants")
      .update({ balance_b: sellerParticipant.balance_b + service.price_b })
      .eq("id", sellerParticipant.id);

    // Calculate expiry
    const expiresAt = service.expires_days
      ? new Date(Date.now() + service.expires_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Create purchased certificate
    const { data: purchase, error: purchErr } = await supabase
      .from("purchased_certificates")
      .insert({
        service_id: service.id,
        game_service_id: gameServiceId,
        game_id: gameId,
        buyer_id: auth.userId,
        seller_id: service.owner_id,
        amount_b: service.price_b,
        transaction_id: transaction.id,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (purchErr) throw purchErr;

    // Decrease quantity
    if (gs.quantity_remaining !== null) {
      const newQty = gs.quantity_remaining - 1;
      await supabase
        .from("game_services")
        .update({
          quantity_remaining: newQty,
          is_active: newQty > 0,
        })
        .eq("id", gameServiceId);
    }

    // Notify seller
    const { data: sellerUser } = await supabase
      .from("users")
      .select("telegram_id, first_name")
      .eq("id", service.owner_id)
      .single();

    const { data: buyerUser } = await supabase
      .from("users")
      .select("first_name")
      .eq("id", auth.userId)
      .single();

    if (sellerUser?.telegram_id) {
      const buyerName = escapeHtml(buyerUser?.first_name || "Покупатель");
      notifyUser(
        sellerUser.telegram_id,
        `🎉 <b>Продажа!</b>\n\n${buyerName} купил «${escapeHtml(service.title)}» за ${formatBarters(service.price_b)}`
      ).catch(() => {});
    }

    return NextResponse.json({ purchase, transaction });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
