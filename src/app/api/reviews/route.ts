export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/reviews?userId=xxx — get reviews for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        author:users!author_id(id, first_name, last_name, photo_url)
      `)
      .eq("target_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/reviews — leave a review after certificate is redeemed
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { purchaseId, rating, text } = body;

    if (!purchaseId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "purchaseId and rating (1-5) required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check purchase exists and is redeemed
    const { data: purchase } = await supabase
      .from("purchased_certificates")
      .select("buyer_id, seller_id, status")
      .eq("id", purchaseId)
      .single();

    if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    if (purchase.status !== "redeemed") {
      return NextResponse.json({ error: "Can only review redeemed certificates" }, { status: 400 });
    }

    // Must be buyer or seller
    const isBuyer = purchase.buyer_id === auth.userId;
    const isSeller = purchase.seller_id === auth.userId;
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Not your certificate" }, { status: 403 });
    }

    const targetId = isBuyer ? purchase.seller_id : purchase.buyer_id;

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        purchase_id: purchaseId,
        author_id: auth.userId,
        target_id: targetId,
        rating,
        text: text || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
