import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

const EXCHANGE_RATE = 10; // 1 RUB = 10 B

// POST /api/bank/withdraw - sell barters (bank_out)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameId, amountB } = body;

    if (!gameId || !amountB || amountB <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const amountRub = Math.floor(amountB / EXCHANGE_RATE);
    const supabase = createServerClient();

    // Check that bank is open
    const { data: game } = await supabase
      .from("games")
      .select("bank_open")
      .eq("id", gameId)
      .single();

    if (!game?.bank_open) {
      return NextResponse.json({ error: "Bank is closed" }, { status: 400 });
    }

    // Verify participant and check balance
    const { data: participant } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", auth.userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Not a participant of this game" }, { status: 403 });
    }

    if (Number(participant.balance_b) < amountB) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        game_id: gameId,
        from_user_id: auth.userId,
        amount_b: amountB,
        amount_rub: amountRub,
        type: "bank_out",
        note: `Возврат ${amountB} Б → ${amountRub} ₽`,
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update balance
    const { error: balError } = await supabase
      .from("game_participants")
      .update({ balance_b: Number(participant.balance_b) - amountB })
      .eq("id", participant.id);

    if (balError) throw balError;

    return NextResponse.json({
      transaction,
      newBalance: Number(participant.balance_b) - amountB,
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 });
  }
}
