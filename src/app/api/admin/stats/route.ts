import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/stats - system-wide statistics (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Check admin role
    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Users by role
    const { data: allUsers } = await supabase
      .from("users")
      .select("role");

    const usersByRole = {
      user: 0,
      manager: 0,
      admin: 0,
    };
    (allUsers || []).forEach((u) => {
      if (u.role in usersByRole) usersByRole[u.role as keyof typeof usersByRole]++;
    });

    // All games
    const { data: allGames } = await supabase
      .from("games")
      .select("id, title, status, event_date, ticket_price_rub, created_at")
      .order("event_date", { ascending: false });

    const gamesByStatus: Record<string, number> = {};
    (allGames || []).forEach((g) => {
      gamesByStatus[g.status] = (gamesByStatus[g.status] || 0) + 1;
    });

    // Total transactions across all games
    const { data: allTx } = await supabase
      .from("transactions")
      .select("type, amount_b, amount_rub");

    let totalTransfers = 0;
    let totalVolumeB = 0;
    let totalBankInRub = 0;
    let totalBankOutRub = 0;

    (allTx || []).forEach((t) => {
      if (t.type === "transfer") {
        totalTransfers++;
        totalVolumeB += Number(t.amount_b);
      }
      if (t.type === "bank_in") totalBankInRub += Number(t.amount_rub || 0);
      if (t.type === "bank_out") totalBankOutRub += Number(t.amount_rub || 0);
    });

    // Total participants
    const { count: totalParticipants } = await supabase
      .from("game_participants")
      .select("*", { count: "exact", head: true });

    // Certificates
    const { data: allCerts } = await supabase
      .from("purchased_certificates")
      .select("status");

    const certsByStatus = { active: 0, redeemed: 0, expired: 0 };
    (allCerts || []).forEach((c) => {
      if (c.status in certsByStatus) certsByStatus[c.status as keyof typeof certsByStatus]++;
    });

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        byRole: usersByRole,
      },
      games: {
        total: (allGames || []).length,
        byStatus: gamesByStatus,
        list: (allGames || []).slice(0, 10),
      },
      transactions: {
        totalTransfers,
        totalVolumeB,
        totalBankInRub,
        totalBankOutRub,
      },
      participants: {
        total: totalParticipants || 0,
      },
      certificates: certsByStatus,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
