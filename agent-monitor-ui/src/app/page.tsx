import { DashboardShell } from "@/components/dashboard-shell";
import type { MonitorStatus } from "@/types/monitor";

export const dynamic = "force-dynamic";

async function getMonitorStatus(): Promise<MonitorStatus> {
  const base = process.env.MONITOR_API_BASE ?? "http://127.0.0.1:8787";
  const forceRefresh = process.env.MONITOR_FORCE_REFRESH === "1";
  const demoDelayMs = Number(process.env.MONITOR_DEMO_DELAY_MS ?? "0");
  const statusUrl = `${base}/api/status${forceRefresh ? "?force=1" : ""}`;

  if (demoDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, demoDelayMs));
  }

  const res = await fetch(statusUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`monitor api returned ${res.status}`);
  }
  return (await res.json()) as MonitorStatus;
}

export default async function Home() {
  let data: MonitorStatus | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getMonitorStatus();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "unknown error";
  }

  if (data) {
    return <DashboardShell data={data} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-xl rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Agent Monitor UI</h1>
        <p className="mt-2 text-sm text-zinc-600">Failed to load monitor data from backend.</p>
        <pre className="mt-4 overflow-auto rounded-md bg-zinc-100 p-3 text-xs text-zinc-700">
          {errorMessage ?? "unknown error"}
        </pre>
        <p className="mt-3 text-xs text-zinc-500">Set MONITOR_API_BASE if backend is not on http://127.0.0.1:8787.</p>
      </div>
    </main>
  );
}
