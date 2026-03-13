import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

const EXCHANGE_RATE = 10; // 1 RUB = 10 B

// POST /api/bank/deposit - buy barters (bank_in)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameId, amountRub } = body;

    if (!gameId || !amountRub || amountRub <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const amountB = amountRub * EXCHANGE_RATE;
    const supabase = createServerClient();

    // Verify participant exists in this game
    const { data: participant } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", auth.userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Not a participant of this game" }, { status: 403 });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        game_id: gameId,
        to_user_id: auth.userId,
        amount_b: amountB,
        amount_rub: amountRub,
        type: "bank_in",
        note: `Покупка ${amountB} Б за ${amountRub} ₽`,
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update balance
    const { error: balError } = await supabase
      .from("game_participants")
      .update({ balance_b: Number(participant.balance_b) + amountB })
      .eq("id", participant.id);

    if (balError) throw balError;

    return NextResponse.json({
      transaction,
      newBalance: Number(participant.balance_b) + amountB,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "Deposit failed" }, { status: 500 });
  }
}
