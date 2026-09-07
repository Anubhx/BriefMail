import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/system/actions - retrieve all pending action items for entity isolation
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();
  const { data: appUser } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { data: actions, error } = await db
    .from("action_items")
    .select(`
      *,
      emails (
        id,
        subject,
        from_email,
        from_name,
        snippet,
        received_at
      )
    `)
    .eq("user_id", appUser.id)
    .eq("is_completed", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actions: actions || [] });
}
