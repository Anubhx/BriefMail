import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const updateProgressSchema = z.object({
  job_id: z.string().uuid(),
  processed: z.number().default(0),
  next_page_token: z.string().nullable().optional(),
  is_complete: z.boolean().default(false),
});

function validateN8nSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-n8n-secret");
  return secret === process.env.N8N_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { job_id, processed, next_page_token, is_complete } = parsed.data;
  const db = createServerClient();

  const { data: job, error: fetchErr } = await db
    .from("batch_jobs")
    .select("id, processed_count, status")
    .eq("id", job_id)
    .single();

  if (fetchErr || !job) {
    return NextResponse.json({ error: "batch_job_not_found" }, { status: 404 });
  }

  const updatedProcessedCount = (job.processed_count || 0) + processed;
  const newStatus = is_complete ? "completed" : "processing";
  const completedAt = is_complete ? new Date().toISOString() : null;

  const { error: updateErr } = await db
    .from("batch_jobs")
    .update({
      processed_count: updatedProcessedCount,
      current_page_token: next_page_token ?? null,
      status: newStatus,
      completed_at: completedAt,
    })
    .eq("id", job_id);

  if (updateErr) {
    return NextResponse.json(
      { error: "failed_to_update_batch_job", details: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    updated: true,
    job_id,
    status: newStatus,
    total_processed: updatedProcessedCount,
    is_complete,
  });
}
