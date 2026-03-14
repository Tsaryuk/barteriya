import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

const DEMO_MODE = !process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY;

// POST /api/payments - create a payment (YooKassa or demo mode)
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
      .select("id, title, ticket_price_rub, status")
      .eq("id", gameId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // Check participant exists
    const { data: participant } = await supabase
      .from("game_participants")
      .select("id, paid")
      .eq("game_id", gameId)
      .eq("user_id", auth.userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "You must join the game first" }, { status: 400 });
    }

    if (participant.paid) {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const returnUrl = `${proto}://${host}/games/${gameId}?payment=success`;

    // Free game — mark paid immediately
    if (!game.ticket_price_rub || game.ticket_price_rub <= 0) {
      await supabase
        .from("game_participants")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", participant.id);

      return NextResponse.json({
        paymentId: "free",
        confirmationUrl: returnUrl,
      });
    }

    // Demo mode — skip payments table, just mark paid
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
