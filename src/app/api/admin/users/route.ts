import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/users - list all users (admin only)
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

    const search = req.nextUrl.searchParams.get("search") || "";
    const role = req.nextUrl.searchParams.get("role") || "";

    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (role) {
      query = query.eq("role", role);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,username.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: users, error } = await query;
    if (error) throw error;

    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
