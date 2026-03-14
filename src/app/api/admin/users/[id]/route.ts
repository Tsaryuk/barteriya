export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// PATCH /api/admin/users/:id - block/unblock user (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    if (params.id === auth.userId) {
      return NextResponse.json({ error: "Cannot modify own account" }, { status: 400 });
    }

    const body = await req.json();
    const allowedFields: Record<string, unknown> = {};

    if (typeof body.is_blocked === "boolean") {
      allowedFields.is_blocked = body.is_blocked;
    }

    if (body.role && ["user", "organizer", "admin"].includes(body.role)) {
      allowedFields.role = body.role;
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update(allowedFields)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
