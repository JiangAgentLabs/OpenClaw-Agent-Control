"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonitorStatus } from "@/types/monitor";

type AgentRow = MonitorStatus["agent_execution"][number];

export function AgentCharts({ rows }: { rows: AgentRow[] }) {
  const stageMap = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.stage] = (acc[row.stage] ?? 0) + 1;
    return acc;
  }, {});
  const stageData = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

  const progressData = rows.map((row) => ({ agent: row.agent, progress: row.progress }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 rounded-lg border p-3">
        <h4 className="mb-2 text-sm font-semibold text-zinc-800">Agent Stage Distribution</h4>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={stageData} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={90} fill="#16a34a" label />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-lg border p-3">
        <h4 className="mb-2 text-sm font-semibold text-zinc-800">Agent Progress</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="agent" hide />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="progress" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
