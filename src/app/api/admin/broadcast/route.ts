import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { sendMessage, escapeHtml } from "@/lib/telegram";

// POST /api/admin/broadcast - send message to all users via Telegram bot
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { text, target } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Get target users
    let query = supabase
      .from("users")
      .select("telegram_id")
      .not("telegram_id", "is", null);

    if (target === "game_participants") {
      // Only users who participate in any active game
      const { data: activeGames } = await supabase
        .from("games")
        .select("id")
        .in("status", ["open", "active"]);

      if (activeGames && activeGames.length > 0) {
        const gameIds = activeGames.map((g) => g.id);
        const { data: participants } = await supabase
          .from("game_participants")
          .select("user_id")
          .in("game_id", gameIds);

        if (participants && participants.length > 0) {
          const userIds = Array.from(new Set(participants.map((p) => p.user_id)));
          query = query.in("id", userIds);
        } else {
          return NextResponse.json({ sent: 0, failed: 0, total: 0 });
        }
      } else {
        return NextResponse.json({ sent: 0, failed: 0, total: 0 });
      }
    }
    // target === "all" or undefined -> send to everyone

    const { data: users } = await query;
    if (!users || users.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    const messageText = `📢 <b>Бартерия</b>\n\n${escapeHtml(text.trim())}`;

    let sent = 0;
    let failed = 0;

    // Send in batches to avoid rate limits
    for (const user of users) {
      if (!user.telegram_id) continue;
      const ok = await sendMessage({
        chat_id: user.telegram_id,
        text: messageText,
      });
      if (ok) sent++;
      else failed++;
      // Telegram rate limit: ~30 msgs/sec
      if ((sent + failed) % 25 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return NextResponse.json({ sent, failed, total: users.length });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
}
