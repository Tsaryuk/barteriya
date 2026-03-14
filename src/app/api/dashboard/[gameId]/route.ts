import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/dashboard/:gameId - aggregated dashboard data for big screen
export async function GET(_req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const supabase = createServerClient();

    // Get game info
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("id", params.gameId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // Participants with user details
    const { data: participants } = await supabase
      .from("game_participants")
      .select(`
        id, balance_b, pitch_order, pitch_status, paid, checked_in, checked_in_at,
        user:users(id, first_name, last_name, username, about, photo_url)
      `)
      .eq("game_id", params.gameId)
      .order("balance_b", { ascending: false });

    // Transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select(`
        *,
        from_user:users!from_user_id(id, first_name, last_name),
        to_user:users!to_user_id(id, first_name, last_name)
      `)
      .eq("game_id", params.gameId)
      .order("created_at", { ascending: false });

    // Certificates stats
    const { data: certificates } = await supabase
      .from("purchased_certificates")
      .select("status")
      .eq("game_id", params.gameId);

    // Pitch session
    const { data: pitchSession } = await supabase
      .from("pitch_sessions")
      .select(`
        *,
        current_speaker:game_participants!current_speaker_id(
          id, pitch_order, pitch_status,
          user:users(id, first_name, last_name, username, about)
        )
      `)
      .eq("game_id", params.gameId)
      .single();

    // Pitch queue
    const { data: pitchQueue } = await supabase
      .from("game_participants")
      .select(`
        id, pitch_order, pitch_status,
        user:users(id, first_name, last_name, username, about)
      `)
      .eq("game_id", params.gameId)
      .not("pitch_order", "is", null)
      .order("pitch_order", { ascending: true });

    // Compute stats
    const txList = transactions || [];
    const certList = certificates || [];
    const participantList = participants || [];

    const totalDeals = txList.filter((t) => t.type === "transfer").length;
    const totalBankIn = txList
      .filter((t) => t.type === "bank_in")
      .reduce((sum, t) => sum + Number(t.amount_rub || 0), 0);
    const totalBankOut = txList
      .filter((t) => t.type === "bank_out")
      .reduce((sum, t) => sum + Number(t.amount_rub || 0), 0);
    const totalBartersInCirculation = participantList.reduce(
      (sum, p) => sum + Number(p.balance_b),
      0
    );

    const transferTxs = txList.filter((t) => t.type === "transfer");
    const avgDealSize =
      transferTxs.length > 0
        ? Math.round(
            transferTxs.reduce((sum, t) => sum + Number(t.amount_b), 0) / transferTxs.length
          )
        : 0;

    // Game duration
    const gameStart = new Date(game.event_date).getTime();
    const elapsedMinutes = Math.max(1, (Date.now() - gameStart) / 60000);
    const dealsPerMinute = Math.round((totalDeals / elapsedMinutes) * 10) / 10;

    const certsByStatus = {
      active: certList.filter((c) => c.status === "active").length,
      redeemed: certList.filter((c) => c.status === "redeemed").length,
      expired: certList.filter((c) => c.status === "expired").length,
    };

    // Top participants by deal volume
    const volumeByUser: Record<string, number> = {};
    transferTxs.forEach((t) => {
      if (t.from_user_id) volumeByUser[t.from_user_id] = (volumeByUser[t.from_user_id] || 0) + Number(t.amount_b);
      if (t.to_user_id) volumeByUser[t.to_user_id] = (volumeByUser[t.to_user_id] || 0) + Number(t.amount_b);
    });

    return NextResponse.json({
      game,
      stats: {
        totalParticipants: participantList.length,
        paidCount: participantList.filter((p: { paid?: boolean }) => p.paid).length,
        checkedInCount: participantList.filter((p: { checked_in?: boolean }) => p.checked_in).length,
        totalDeals,
        totalBankIn,
        totalBankOut,
        totalBartersInCirculation,
        dealsPerMinute,
        avgDealSize,
        certsByStatus,
      },
      participants: participantList,
      transactions: txList.slice(0, 20),
      pitchSession,
      pitchQueue: pitchQueue || [],
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
