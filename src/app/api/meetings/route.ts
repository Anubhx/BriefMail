import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  organizer_name: z.string().optional(),
  organizer_email: z.string().email().optional().or(z.literal("")),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  meeting_link: z.string().url().optional().or(z.literal("")),
  platform: z.enum(["meet", "zoom", "teams", "other"]).default("meet"),
  agenda: z.string().optional(),
  attendees: z.array(z.object({ name: z.string().optional(), email: z.string() })).optional(),
});

// GET /api/meetings — fetch upcoming & past meetings
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

  const { data: allMeetings, error } = await db
    .from("meetings")
    .select("*")
    .eq("user_id", appUser.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const upcoming = [];
  const past = [];

  for (const m of allMeetings || []) {
    const startTime = m.start_time ? new Date(m.start_time) : null;
    // If meeting was in the last 30 minutes or in future, consider upcoming
    if (startTime && startTime.getTime() >= now.getTime() - 30 * 60 * 1000) {
      upcoming.push(m);
    } else {
      past.push(m);
    }
  }

  // Sort past meetings descending (most recent past meeting first)
  past.sort((a, b) => {
    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return timeB - timeA;
  });

  return NextResponse.json({
    upcoming,
    past,
    total_count: (allMeetings || []).length,
  });
}

// POST /api/meetings — create new meeting manually
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const parsed = createMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = createServerClient();
  const { data: appUser } = await db
    .from("app_users")
    .select("id, tenant_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const {
    title,
    organizer_name,
    organizer_email,
    start_time,
    end_time,
    meeting_link,
    platform,
    agenda,
    attendees,
  } = parsed.data;

  // Deduce platform if meeting_link provided
  let detectedPlatform = platform;
  if (meeting_link) {
    if (meeting_link.includes("meet.google.com")) detectedPlatform = "meet";
    else if (meeting_link.includes("zoom.us")) detectedPlatform = "zoom";
    else if (meeting_link.includes("teams.")) detectedPlatform = "teams";
  }

  const { data: newMeeting, error } = await db
    .from("meetings")
    .insert({
      tenant_id: appUser.tenant_id,
      user_id: appUser.id,
      title,
      organizer_name: organizer_name || null,
      organizer_email: organizer_email || null,
      start_time,
      end_time: end_time || null,
      meeting_link: meeting_link || null,
      platform: detectedPlatform,
      agenda: agenda || null,
      attendees: attendees || [],
      status: "upcoming",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ meeting: newMeeting }, { status: 201 });
}
