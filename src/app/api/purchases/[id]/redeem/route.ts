import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { notifyUser, escapeHtml } from "@/lib/telegram";

// POST /api/purchases/[id]/redeem — seller burns/redeems the certificate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Only seller can redeem
    const { data: purchase } = await supabase
      .from("purchased_certificates")
      .select("*, service:services!service_id(title)")
      .eq("id", params.id)
      .eq("seller_id", auth.userId)
      .eq("status", "active")
      .single();

    if (!purchase) {
      return NextResponse.json({ error: "Certificate not found or already redeemed" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("purchased_certificates")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Notify buyer
    const { data: buyer } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("id", purchase.buyer_id)
      .single();

    const serviceName = (purchase.service as { title: string })?.title || "сертификат";

    if (buyer?.telegram_id) {
      notifyUser(
        buyer.telegram_id,
        `✅ <b>Сертификат исполнен!</b>\n\n«${escapeHtml(serviceName)}» — услуга оказана.\n\nОставь отзыв в приложении!`
      ).catch(() => {});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Redeem error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
