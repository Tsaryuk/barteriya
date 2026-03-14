export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { notifyUser } from "@/lib/telegram";

// POST /api/payments/webhook - YooKassa webhook notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const payment = body.object;

    if (!payment?.id || !event) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const supabase = createServerClient();

    if (event === "payment.succeeded") {
      const userId = payment.metadata?.user_id;
      const tariffId = payment.metadata?.tariff_id;
      const type = payment.metadata?.type;

      // Update payment record
      await supabase
        .from("payments")
        .update({ status: "succeeded" })
        .eq("yookassa_id", payment.id);

      if (type === "tariff" && userId && tariffId) {
        // Get tariff for duration
        const { data: tariff } = await supabase
          .from("tariffs")
          .select("name, duration_days")
          .eq("id", tariffId)
          .single();

        // Calculate expiry
        const expiresAt = tariff?.duration_days
          ? new Date(Date.now() + tariff.duration_days * 24 * 60 * 60 * 1000).toISOString()
          : null;

        // Update user tariff
        await supabase
          .from("users")
          .update({
            tariff_id: tariffId,
            tariff_expires_at: expiresAt,
          })
          .eq("id", userId);

        // Notify via Telegram
        const { data: user } = await supabase
          .from("users")
          .select("telegram_id")
          .eq("id", userId)
          .single();

        if (user?.telegram_id) {
          const tariffName = tariff?.name || "тариф";
          notifyUser(
            user.telegram_id,
            `✅ <b>Оплата прошла!</b>\n\nТариф «${tariffName}» активирован.${expiresAt ? `\nДействует до ${new Date(expiresAt).toLocaleDateString("ru-RU")}` : ""}`
          ).catch(() => {});
        }
      }

      if (type === "game_ticket" && userId) {
        const gameId = payment.metadata?.game_id;
        if (gameId) {
          // Mark participant as paid
          await supabase
            .from("game_participants")
            .update({ paid: true, paid_at: new Date().toISOString() })
            .eq("game_id", gameId)
            .eq("user_id", userId);

          // Notify via Telegram
          const { data: ticketUser } = await supabase
            .from("users")
            .select("telegram_id")
            .eq("id", userId)
            .single();

          if (ticketUser?.telegram_id) {
            notifyUser(
              ticketUser.telegram_id,
              `✅ <b>Билет оплачен!</b>\n\nВы записаны на игру. Ждём вас!`
            ).catch(() => {});
          }
        }
      }

      if (type === "deposit" && userId) {
        const gameId = payment.metadata?.game_id;
        const amountRub = Number(payment.amount?.value || 0);
        const amountB = amountRub * 10; // 1 RUB = 10 B

        if (gameId && amountB > 0) {
          // Get participant
          const { data: participant } = await supabase
            .from("game_participants")
            .select("id, balance_b")
            .eq("game_id", gameId)
            .eq("user_id", userId)
            .single();

          if (participant) {
            // Create bank_in transaction
            await supabase.from("transactions").insert({
              game_id: gameId,
              to_user_id: userId,
              amount_b: amountB,
              amount_rub: amountRub,
              type: "bank_in",
              note: `Покупка ${amountB} Б за ${amountRub} ₽ (YooKassa)`,
            });

            // Update balance
            await supabase
              .from("game_participants")
              .update({ balance_b: Number(participant.balance_b) + amountB })
              .eq("id", participant.id);
          }
        }
      }
    }

    if (event === "payment.canceled") {
      await supabase
        .from("payments")
        .update({ status: "canceled" })
        .eq("yookassa_id", payment.id);
    }

    // Always return 200 to YooKassa
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    // Still return 200 to prevent retries on processing errors
    return NextResponse.json({ ok: true });
  }
}
