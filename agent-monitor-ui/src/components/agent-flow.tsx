"use client";

import { useMemo } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MonitorStatus } from "@/types/monitor";

export function AgentFlow({
  agents,
  subs,
}: {
  agents: MonitorStatus["agent_execution"];
  subs: MonitorStatus["subagent_execution"];
}) {
  const { nodes, edges } = useMemo(() => {
    const rootNodes: Node[] = agents.map((agent, idx) => ({
      id: `agent:${agent.agent}`,
      position: { x: 40, y: idx * 90 + 40 },
      data: { label: `${agent.agent} (${agent.stage})` },
      style: {
        border: "1px solid #d4d4d8",
        borderRadius: 8,
        padding: 8,
        background: agent.status === "error" ? "#fff1f2" : agent.status === "warn" ? "#fffbeb" : "#f0fdf4",
      },
    }));

    const childNodes: Node[] = subs.map((sub, idx) => ({
      id: `sub:${sub.agent}`,
      position: { x: 430, y: idx * 80 + 40 },
      data: { label: `${sub.agent} (${sub.stage})` },
      style: {
        border: "1px solid #d4d4d8",
        borderRadius: 8,
        padding: 8,
        background: sub.status === "error" ? "#fff1f2" : sub.status === "warn" ? "#fffbeb" : "#eff6ff",
      },
    }));

    const links: Edge[] = subs.map((sub) => ({
      id: `edge:${sub.parent_agent}->${sub.agent}`,
      source: `agent:${sub.parent_agent}`,
      target: `sub:${sub.agent}`,
      animated: sub.status !== "ok",
    }));

    return { nodes: [...rootNodes, ...childNodes], edges: links };
  }, [agents, subs]);

  return (
    <div className="h-[380px] rounded-lg border">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap zoomable pannable />
        <Controls />
        <Background gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
