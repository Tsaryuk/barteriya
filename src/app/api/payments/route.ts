import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

const DEMO_MODE = !process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY;

// POST /api/payments - pay for game (auto-joins if not a participant yet)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";

    const { data: game } = await supabase
      .from("games")
      .select("id, title, ticket_price_rub, status, max_participants")
      .eq("id", gameId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    if (game.status !== "open" && game.status !== "active") {
      return NextResponse.json({ error: "Игра не открыта для записи" }, { status: 400 });
    }

    // Check if already a participant
    let { data: participant } = await supabase
      .from("game_participants")
      .select("id, paid")
      .eq("game_id", gameId)
      .eq("user_id", auth.userId)
      .single();

    // Auto-join if not a participant yet
    if (!participant) {
      // Check max participants
      if (game.max_participants) {
        const { count } = await supabase
          .from("game_participants")
          .select("*", { count: "exact", head: true })
          .eq("game_id", gameId);
        if (count && count >= game.max_participants) {
          return NextResponse.json({ error: "Все места заняты" }, { status: 400 });
        }
      }

      // Get next pitch order
      const { data: lastP } = await supabase
        .from("game_participants")
        .select("pitch_order")
        .eq("game_id", gameId)
        .order("pitch_order", { ascending: false })
        .limit(1)
        .single();

      const pitchOrder = (lastP?.pitch_order || 0) + 1;

      // Get user's global balance
      const { data: userData } = await supabase
        .from("users")
        .select("balance_b")
        .eq("id", auth.userId)
        .single();

      const { data: newParticipant, error: joinError } = await supabase
        .from("game_participants")
        .insert({
          game_id: gameId,
          user_id: auth.userId,
          pitch_order: pitchOrder,
          balance_b: Number(userData?.balance_b) || 0,
        })
        .select("id, paid")
        .single();

      if (joinError) throw joinError;
      participant = newParticipant;
    }

    if (participant.paid) {
      return NextResponse.json({ error: "Уже оплачено" }, { status: 400 });
    }

    const returnUrl = `${proto}://${host}/games/${gameId}?payment=success`;

    // Free game — mark paid immediately
    if (!game.ticket_price_rub || game.ticket_price_rub <= 0) {
      await supabase
        .from("game_participants")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", participant.id);

      return NextResponse.json({ paymentId: "free", confirmationUrl: returnUrl });
    }

    // Demo mode — just mark paid
    if (DEMO_MODE) {
      await supabase
        .from("game_participants")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", participant.id);

      return NextResponse.json({
        paymentId: `demo_${crypto.randomUUID()}`,
        confirmationUrl: returnUrl,
      });
    }

    // Real YooKassa payment
    const { createPayment } = await import("@/lib/yookassa");
    const payment = await createPayment({
      amountRub: game.ticket_price_rub,
      description: `Бартерия — билет на «${game.title}»`,
      returnUrl,
      metadata: {
        user_id: auth.userId,
        game_id: gameId,
        type: "game_ticket",
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
