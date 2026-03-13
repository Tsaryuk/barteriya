import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { createPayment } from "@/lib/yookassa";

// POST /api/payments - create a YooKassa payment for tariff purchase
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tariffId } = body;

    if (!tariffId) {
      return NextResponse.json({ error: "tariffId required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get tariff
    const { data: tariff } = await supabase
      .from("tariffs")
      .select("*")
      .eq("id", tariffId)
      .eq("is_active", true)
      .single();

    if (!tariff) {
      return NextResponse.json({ error: "Tariff not found" }, { status: 404 });
    }

    // Determine return URL
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const returnUrl = `${proto}://${host}/tariffs?payment=success`;

    // Create YooKassa payment
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

    // Save payment record to DB
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
