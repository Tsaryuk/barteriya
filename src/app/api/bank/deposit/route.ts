import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

const EXCHANGE_RATE = 10; // 1 RUB = 10 B

// POST /api/bank/deposit - buy barters (bank_in)
// Supports: self-deposit OR organizer deposits for a participant (userId param)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameId, amountRub, userId } = body;

    if (!gameId || !amountRub || amountRub <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const amountB = amountRub * EXCHANGE_RATE;
    const supabase = createServerClient();
    const targetUserId = userId || auth.userId;

    // If depositing for another user, verify caller is organizer/admin
    if (userId && userId !== auth.userId) {
      const { data: game } = await supabase
        .from("games")
        .select("organizer_id")
        .eq("id", gameId)
        .single();

      const { data: callerUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.userId)
        .single();

      if (game?.organizer_id !== auth.userId && callerUser?.role !== "admin") {
        return NextResponse.json({ error: "Only organizer or admin can deposit for others" }, { status: 403 });
      }
    }

    // Check that bank is open
    const { data: game } = await supabase
      .from("games")
      .select("bank_open")
      .eq("id", gameId)
      .single();

    if (!game?.bank_open) {
      return NextResponse.json({ error: "Bank is closed" }, { status: 400 });
    }

    // Verify participant exists in this game
    const { data: participant } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", targetUserId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Not a participant of this game" }, { status: 403 });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        game_id: gameId,
        to_user_id: targetUserId,
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
