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
    const { tariffId, gameId } = body;

    if (!tariffId && !gameId) {
      return NextResponse.json({ error: "tariffId or gameId required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";

    // Game ticket payment
    if (gameId) {
      const { data: game } = await supabase
        .from("games")
        .select("id, title, ticket_price_rub, status")
        .eq("id", gameId)
        .single();

      if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
      if (game.status !== "open") return NextResponse.json({ error: "Game not open" }, { status: 400 });
      if (!game.ticket_price_rub || game.ticket_price_rub <= 0) {
        // Free game — mark paid immediately
        const { data: existing } = await supabase
          .from("game_participants")
          .select("id")
          .eq("game_id", gameId)
          .eq("user_id", auth.userId)
          .single();
        if (existing) {
          await supabase
            .from("game_participants")
            .update({ paid: true, paid_at: new Date().toISOString() })
            .eq("game_id", gameId)
            .eq("user_id", auth.userId);
        }
        return NextResponse.json({
          paymentId: "free",
          confirmationUrl: `${proto}://${host}/games/${gameId}?payment=success`,
        });
      }

      // Check if already paid
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, status")
        .eq("user_id", auth.userId)
        .eq("game_id", gameId)
        .eq("status", "succeeded")
        .single();

      if (existingPayment) {
        return NextResponse.json({ error: "Already paid for this game" }, { status: 400 });
      }

      const returnUrl = `${proto}://${host}/games/${gameId}?payment=success`;

      if (DEMO_MODE) {
        const paymentId = crypto.randomUUID();
        await supabase.from("payments").insert({
          id: paymentId,
          user_id: auth.userId,
          game_id: gameId,
          amount_rub: game.ticket_price_rub,
          status: "succeeded",
          yookassa_id: `demo_${paymentId}`,
        });

        // Mark participant as paid
        await supabase
          .from("game_participants")
          .update({ paid: true, paid_at: new Date().toISOString() })
          .eq("game_id", gameId)
          .eq("user_id", auth.userId);

        return NextResponse.json({
          paymentId,
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

      await supabase.from("payments").insert({
        id: payment.id,
        user_id: auth.userId,
        game_id: gameId,
        amount_rub: game.ticket_price_rub,
        status: "pending",
        yookassa_id: payment.id,
      });

      return NextResponse.json({
        paymentId: payment.id,
        confirmationUrl: payment.confirmation?.confirmation_url,
      });
    }

    // Tariff payment
    const { data: tariff } = await supabase
      .from("tariffs")
      .select("*")
      .eq("id", tariffId)
      .eq("is_active", true)
      .single();

    if (!tariff) {
      return NextResponse.json({ error: "Tariff not found" }, { status: 404 });
    }

    const returnUrl = `${proto}://${host}/tariffs?payment=success`;

    if (DEMO_MODE) {
      const paymentId = crypto.randomUUID();
      await supabase.from("payments").insert({
        id: paymentId,
        user_id: auth.userId,
        tariff_id: tariffId,
        amount_rub: tariff.price_rub,
        status: "succeeded",
        yookassa_id: `demo_${paymentId}`,
      });
      return NextResponse.json({
        paymentId,
        confirmationUrl: returnUrl,
      });
    }

    const { createPayment } = await import("@/lib/yookassa");
    const payment = await createPayment({
      amountRub: tariff.price_rub,
      description: `Бартерия — тариф "${tariff.name}"`,
      returnUrl,
      metadata: {
        user_id: auth.userId,
        tariff_id: tariffId,
        type: "tariff",
      },
    });

    await supabase.from("payments").insert({
      id: payment.id,
      user_id: auth.userId,
      tariff_id: tariffId,
      amount_rub: tariff.price_rub,
      status: "pending",
      yookassa_id: payment.id,
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
