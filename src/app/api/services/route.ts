export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/services — get my services
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("owner_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/services — create a service
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, price_b, original_price_rub, quantity, expires_days } = body;

    if (!title || !price_b || price_b <= 0) {
      return NextResponse.json({ error: "title and price_b required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("services")
      .insert({
        owner_id: auth.userId,
        title,
        description: description || null,
        price_b,
        original_price_rub: original_price_rub || null,
        quantity: quantity || null,
        expires_days: expires_days || 365,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
