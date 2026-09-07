import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { classifyByRules } from "@/lib/ai/tier1-rules";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

interface EmailRow {
  id: string;
  from_email: string;
  from_name?: string | null;
  subject: string;
  snippet?: string | null;
  labels?: string[] | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate x-n8n-secret header
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();
  const includeRegex = request.nextUrl.searchParams.get("include_regex") === "true";

  // 1. Fetch 50 emails WHERE category IS NULL (or classification_tier = 'regex' if requested)
  let selectQuery = db
    .from("emails")
    .select("id, from_email, from_name, subject, snippet, labels");

  if (includeRegex) {
    selectQuery = selectQuery.or("category.is.null,classification_tier.eq.regex");
  } else {
    selectQuery = selectQuery.is("category", null);
  }

  const { data: rawEmails, error: selectErr } = await selectQuery.limit(50);

  if (selectErr) {
    console.error("[emails/reclassify-all] Database select error:", selectErr);
    return NextResponse.json(
      { error: "db_query_failed", details: selectErr.message },
      { status: 500 }
    );
  }

  const emails = (rawEmails || []) as EmailRow[];

  // If no emails found
  if (emails.length === 0) {
    const { count: remainingCount } = await db
      .from("emails")
      .select("*", { count: "exact", head: true })
      .is("category", null);

    return NextResponse.json({
      reclassified: 0,
      remaining: remainingCount ?? 0,
    });
  }

  // 2. For each email run classifyByRules() from tier1-rules
  // 3. If result is null (no rule matched): set category = 'system', confidence = 0.5, tier_used = 'regex'
  // 4. UPDATE emails SET category, subcategory, confidence, tier, is_archived, is_read WHERE id = email.id
  const updatePromises = emails.map((email) => {
    const result = classifyByRules({
      from_email: email.from_email,
      from_name: email.from_name ?? undefined,
      subject: email.subject ?? "",
      snippet: email.snippet ?? undefined,
      labels: email.labels ?? undefined,
    });

    const category = result?.category ?? "system";
    const subcategory = result?.subcategory ?? "unknown";
    const confidence = result?.confidence ?? 0.5;
    const tier = result?.tier ?? "regex";
    const isArchived = category === "ads" || category === "newsletter";
    const isRead = category === "ads";

    return db
      .from("emails")
      .update({
        category,
        subcategory,
        confidence_score: confidence,
        classification_tier: tier,
        is_archived: isArchived,
        is_read: isRead,
        updated_at: new Date().toISOString(),
      })
      .eq("id", email.id);
  });

  // 5. Run all 50 UPDATEs in parallel with Promise.allSettled()
  const results = await Promise.allSettled(updatePromises);

  let reclassified = 0;
  for (const res of results) {
    if (res.status === "fulfilled" && !res.value.error) {
      reclassified++;
    } else if (res.status === "fulfilled" && res.value.error) {
      console.warn("[emails/reclassify-all] Update error:", res.value.error);
    } else if (res.status === "rejected") {
      console.warn("[emails/reclassify-all] Update rejected:", res.reason);
    }
  }

  // 6. Count remaining: SELECT COUNT(*) FROM emails WHERE category IS NULL
  const { count: remainingCount } = await db
    .from("emails")
    .select("*", { count: "exact", head: true })
    .is("category", null);

  // 7. Return { reclassified: number, remaining: number }
  return NextResponse.json({
    reclassified,
    remaining: remainingCount ?? 0,
  });
}
