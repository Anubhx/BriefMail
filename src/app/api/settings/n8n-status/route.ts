import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const n8nBase = process.env.N8N_URL || "http://localhost:5678";
  const healthUrl = `${n8nBase.replace(/\/+$/, "")}/healthz`;

  try {
    const res = await fetch(healthUrl, {
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ online: false });
    }

    let version: string | undefined;
    try {
      const data = await res.json();
      version = data.version || data.status;
    } catch {
      // Endpoint may return text response like "OK"
    }

    return NextResponse.json({ online: true, version });
  } catch {
    return NextResponse.json({ online: false });
  }
}
