import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.MONITOR_API_BASE ?? "http://127.0.0.1:8787";
  const forceRefresh = process.env.MONITOR_FORCE_REFRESH === "1";
  const demoDelayMs = Number(process.env.MONITOR_DEMO_DELAY_MS ?? "0");
  const url = `${base}/api/status${forceRefresh ? "?force=1" : ""}`;

  try {
    if (demoDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, demoDelayMs));
    }
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `monitor api returned ${res.status}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 },
    );
  }
}
