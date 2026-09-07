import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});

// DELETE /api/career/applications/bulk-delete
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { ids } = parsed.data;
  const db = createServerClient();

  // Find user by clerk_user_id
  const { data: appUser } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const userIds = [appUser.id, userId].filter(Boolean);

  // 1. Delete associated offer_letters first in case of foreign key constraints
  await db
    .from("offer_letters")
    .delete()
    .in("job_app_id", ids);

  // 2. Delete job applications owned by this user
  const { error, count } = await db
    .from("job_applications")
    .delete({ count: "exact" })
    .in("id", ids)
    .in("user_id", userIds);

  if (error) {
    console.error("Error bulk deleting job applications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true, count: count ?? ids.length });
}

// POST alias for clients that do not send bodies on DELETE
export async function POST(request: NextRequest): Promise<NextResponse> {
  return DELETE(request);
}
