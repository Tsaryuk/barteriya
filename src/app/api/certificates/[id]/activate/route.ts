export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/certificates/:id/activate - mark certificate as activated
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    const { data: cert } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    if (cert.status !== "active") {
      return NextResponse.json({ error: "Certificate is not active" }, { status: 400 });
    }

    // Only buyer or seller can activate
    if (cert.buyer_id !== auth.userId && cert.seller_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("certificates")
      .update({
        status: "activated",
        activated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Activate certificate error:", error);
    return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
  }
}
