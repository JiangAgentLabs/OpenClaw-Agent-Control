"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Globe,
  Layers3,
  Search,
  ShieldAlert,
} from "lucide-react";
import { AgentCharts } from "@/components/agent-charts";
import { AgentFlow } from "@/components/agent-flow";
import { AgentTable } from "@/components/agent-table";
import { SubagentTable } from "@/components/subagent-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonitorStatus } from "@/types/monitor";

type ViewMode = "all" | "risk" | "running";
type SubViewMode = "all" | "failed" | "running";
type AgentSort = "risk" | "progress" | "name";

type PersistedUiState = Partial<{
  lang: "zh" | "en";
  viewMode: ViewMode;
  subViewMode: SubViewMode;
  agentSort: AgentSort;
  keyword: string;
  showFlow: boolean;
  showCharts: boolean;
}>;

function readPersistedUiState(): PersistedUiState {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem("monitor_ui_state_v1");
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as PersistedUiState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function DashboardShell({ data }: { data: MonitorStatus }) {
  const [initialUi] = useState<PersistedUiState>(() => readPersistedUiState());
  const [lang, setLang] = useState<"zh" | "en">(initialUi.lang === "zh" || initialUi.lang === "en" ? initialUi.lang : "en");
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialUi.viewMode === "all" || initialUi.viewMode === "risk" || initialUi.viewMode === "running" ? initialUi.viewMode : "all",
  );
  const [subViewMode, setSubViewMode] = useState<SubViewMode>(
    initialUi.subViewMode === "all" || initialUi.subViewMode === "failed" || initialUi.subViewMode === "running"
      ? initialUi.subViewMode
      : "all",
  );
  const [agentSort, setAgentSort] = useState<AgentSort>(
    initialUi.agentSort === "risk" || initialUi.agentSort === "progress" || initialUi.agentSort === "name" ? initialUi.agentSort : "risk",
  );
  const [keyword, setKeyword] = useState<string>(typeof initialUi.keyword === "string" ? initialUi.keyword : "");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [timelineFocusId, setTimelineFocusId] = useState<string | null>(null);
  const [showFlow, setShowFlow] = useState<boolean>(typeof initialUi.showFlow === "boolean" ? initialUi.showFlow : false);
  const [showCharts, setShowCharts] = useState<boolean>(typeof initialUi.showCharts === "boolean" ? initialUi.showCharts : true);
  const [timelineLimit, setTimelineLimit] = useState(12);

  const t = useMemo(() => {
    if (lang === "zh") {
      return {
        subtitle: "OpenClaw Agent Control",
        title: "Agent 状态监控与控制台",
        generatedAt: "生成时间",
        stalledAgents: "卡住 Agent",
        importantModules: "重要模块",
        coreDisplay: "核心展示区",
        secondaryArea: "分析与诊断区",
        valueTitle: "先发现风险，再推进执行",
        valueDesc: "把告警、执行状态、协作路径放在同一页面，按优先级处理。",
        focusPanelTitle: "关键风险与焦点",
        focusPanelDesc: "优先处理卡住与异常，避免任务链路中断。",
        stalledNow: "当前卡住",
        abnormalNow: "异常状态",
        priorityList: "优先处理列表",
        noPriorityList: "当前无高优先级异常",
        activeList: "最近活跃",
        noActiveList: "暂无活跃数据",
        cardAgents: "Agents",
        cardAgentsDesc: "当前监控的 Agent 数量",
        sessionsTotal: "会话总数",
        cardSubagents: "子 Agent",
        cardSubagentsDesc: "子 Agent 执行记录",
        statusProgress: "状态与进度已纳入监控",
        statusSemantics: "状态含义",
        semanticIdle: "idle: 无任务/正常空闲",
        semanticExec: "executing: 正在执行",
        semanticWaiting: "waiting: 队列等待(正常)",
        semanticStalled: "stalled: 超时未更新(告警)",
        semanticBlocked: "blocked: 运行中止/失败(错误)",
        cardAborted: "中止次数",
        cardAbortedDesc: "aborted_last_run 汇总",
        allAgents: "来自全部监控 Agent",
        cardSelection: "聚焦对象",
        cardSelectionDesc: "当前筛选上下文",
        selectedAll: "全部",
        selectedAgent: "当前 Agent",
        viewLabel: "视图过滤",
        searchLabel: "关键字过滤",
        searchPlaceholder: "按 agent / task / session 搜索",
        viewAll: "全部",
        viewRisk: "仅风险",
        viewRunning: "仅运行中",
        agentTableTitle: "Agent 执行总览",
        subagentTableTitle: "子 Agent 执行队列",
        tableDesc: "可按风险、运行态、关键字快速筛选",
        graphTitle: "Agent / 子 Agent 关系图",
        graphDesc: "查看协作链路与依赖关系",
        chartTitle: "执行分布图",
        chartDesc: "阶段与进度分布，用于容量判断",
        playbookTitle: "处理剧本",
        playbookDesc: "按固定步骤快速定位问题。",
        step1: "确认当前任务和阶段是否与预期一致",
        step2: "检查子 Agent 队列是否有失败或卡住",
        step3: "根据最近事件判断是否需要重启或重新分配",
        recentEventsTitle: "最近事件",
        noRecentEvents: "暂无该 Agent 的事件",
        stepActionRisk: "仅看风险行",
        stepActionSubFailed: "查看失败子Agent",
        stepActionTimeline: "定位到事件时间轴",
        subFilterLabel: "子 Agent 过滤",
        subViewAll: "全部",
        subViewFailed: "仅失败",
        subViewRunning: "仅运行中",
        timelineTitle: "事件时间轴",
        timelineDesc: "按时间追踪状态变化，辅助判断是否升级处理。",
        timelineEmpty: "暂无事件数据",
        timelineQuickJump: "定位时间轴",
        sortLabel: "排序",
        sortRisk: "风险优先",
        sortProgress: "进度优先",
        sortName: "名称",
        resetFocus: "重置焦点",
        graphToggleOpen: "展开关系图",
        graphToggleClose: "收起关系图",
        graphLazyHint: "默认不渲染关系图，减少页面占用。",
        chartToggleOpen: "展开图表",
        chartToggleClose: "收起图表",
        chartLazyHint: "图表已折叠，可按需展开。",
        timelineShowMore: "查看更多",
        timelineShowLess: "收起",
      };
    }

    return {
      subtitle: "OpenClaw Agent Control",
      title: "Agent Status & Control Console",
      generatedAt: "generated_at",
      stalledAgents: "stalled_agents",
      importantModules: "Important Modules",
      coreDisplay: "Core Display Area",
      secondaryArea: "Analysis & Diagnostics",
      valueTitle: "Detect risk first, then drive execution",
      valueDesc: "Unify alerts, execution status, and collaboration flow in one priority-first view.",
      focusPanelTitle: "Risk & Focus",
      focusPanelDesc: "Prioritize stalled and abnormal rows to prevent chain break.",
      stalledNow: "Stalled",
      abnormalNow: "Abnormal",
      priorityList: "Priority Queue",
      noPriorityList: "No high-priority anomalies",
      activeList: "Recently Active",
      noActiveList: "No active rows",
      cardAgents: "Agents",
      cardAgentsDesc: "Agents being monitored",
      sessionsTotal: "sessions_total",
      cardSubagents: "Sub-agents",
      cardSubagentsDesc: "Sub-agent execution rows",
      statusProgress: "status and progress tracked",
      statusSemantics: "Status Semantics",
      semanticIdle: "idle: no task, normal",
      semanticExec: "executing: actively running",
      semanticWaiting: "waiting: queued, normal",
      semanticStalled: "stalled: timed out, warning",
      semanticBlocked: "blocked: aborted/failed, error",
      cardAborted: "Aborted Runs",
      cardAbortedDesc: "aborted_last_run summary",
      allAgents: "across all monitored agents",
      cardSelection: "Focus",
      cardSelectionDesc: "current filter context",
      selectedAll: "All",
      selectedAgent: "Current Agent",
      viewLabel: "View Filter",
      searchLabel: "Keyword Filter",
      searchPlaceholder: "Search by agent / task / session",
      viewAll: "All",
      viewRisk: "Risk only",
      viewRunning: "Running only",
      agentTableTitle: "Agent Execution Overview",
      subagentTableTitle: "Sub-agent Queue",
      tableDesc: "Fast filter by risk, run-state and keywords",
      graphTitle: "Agent / Sub-agent Graph",
      graphDesc: "Collaboration topology and dependency paths",
      chartTitle: "Execution Distribution",
      chartDesc: "Stage/progress distribution for capacity diagnosis",
      playbookTitle: "Ops Playbook",
      playbookDesc: "Use fixed steps to triage quickly.",
      step1: "Validate current task/stage against expected progress",
      step2: "Check sub-agent queue for failures or stalls",
      step3: "Use recent events to decide restart or reassignment",
      recentEventsTitle: "Recent Events",
      noRecentEvents: "No recent events for this agent",
      stepActionRisk: "Show risk rows",
      stepActionSubFailed: "Show failed sub-agents",
      stepActionTimeline: "Jump to timeline",
      subFilterLabel: "Sub-agent Filter",
      subViewAll: "All",
      subViewFailed: "Failed only",
      subViewRunning: "Running only",
      timelineTitle: "Event Timeline",
      timelineDesc: "Track status changes over time to decide escalation.",
      timelineEmpty: "No event data",
      timelineQuickJump: "Jump timeline",
      sortLabel: "Sort",
      sortRisk: "Risk-first",
      sortProgress: "Progress-first",
      sortName: "Name",
      resetFocus: "Reset focus",
      graphToggleOpen: "Open Graph",
      graphToggleClose: "Hide Graph",
      graphLazyHint: "Graph is lazy-loaded by default to reduce runtime cost.",
      chartToggleOpen: "Open Charts",
      chartToggleClose: "Hide Charts",
      chartLazyHint: "Charts are collapsed. Open on demand.",
      timelineShowMore: "Show more",
      timelineShowLess: "Show less",
    };
  }, [lang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const state = { lang, viewMode, subViewMode, agentSort, keyword, showFlow, showCharts };
      localStorage.setItem("monitor_ui_state_v1", JSON.stringify(state));
    }, 350);
    return () => clearTimeout(timer);
  }, [agentSort, keyword, lang, showCharts, showFlow, subViewMode, viewMode]);

  const priorityAgents = useMemo(
    () =>
      data.agent_execution
        .filter((row) => row.status === "error" || row.status === "warn")
        .sort((a, b) => {
          const aRisk = a.status === "error" ? 0 : 1;
          const bRisk = b.status === "error" ? 0 : 1;
          if (aRisk !== bRisk) {
            return aRisk - bRisk;
          }
          return Number(b.progress ?? 0) - Number(a.progress ?? 0);
        })
        .slice(0, 5),
    [data.agent_execution],
  );

  const activeAgents = useMemo(
    () =>
      [...data.agent_execution]
        .filter((row) => row.stage === "executing" || row.stage === "waiting")
        .sort((a, b) => Number(b.progress ?? 0) - Number(a.progress ?? 0))
        .slice(0, 5),
    [data.agent_execution],
  );

  const abnormalCount = useMemo(
    () => data.agent_execution.filter((row) => row.status === "error" || row.status === "warn").length,
    [data.agent_execution],
  );

  const filteredAgents = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return data.agent_execution.filter((row) => {
      const matchView =
        viewMode === "all"
          ? true
          : viewMode === "risk"
            ? row.status === "error" || row.status === "warn"
            : row.stage === "executing" || row.stage === "waiting";

      const matchSelected = selectedAgent ? row.agent === selectedAgent : true;

      const raw = `${row.agent} ${row.current_task ?? ""} ${row.current_session_key ?? ""}`.toLowerCase();
      const matchKeyword = q ? raw.includes(q) : true;

      return matchView && matchSelected && matchKeyword;
    });
  }, [data.agent_execution, keyword, selectedAgent, viewMode]);

  const filteredSubs = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return data.subagent_execution.filter((row) => {
      const matchSelected = selectedAgent
        ? row.parent_agent === selectedAgent || row.agent === selectedAgent
        : true;
      const raw = `${row.parent_agent} ${row.agent} ${row.current_task}`.toLowerCase();
      const matchKeyword = q ? raw.includes(q) : true;
      const matchSubView =
        subViewMode === "all"
          ? true
          : subViewMode === "failed"
            ? row.result === "failed" || row.status === "error"
            : row.result === "running" || row.stage === "executing";
      return matchSelected && matchKeyword && matchSubView;
    });
  }, [data.subagent_execution, keyword, selectedAgent, subViewMode]);

  const selectedAgentRow = useMemo(
    () => (selectedAgent ? data.agent_execution.find((row) => row.agent === selectedAgent) ?? null : null),
    [data.agent_execution, selectedAgent],
  );

  const selectedRecentEvents = useMemo(() => {
    if (!selectedAgent) {
      return [];
    }
    const events = Array.isArray(data.recent_events) ? data.recent_events : [];
    return events
      .filter((item) => item.id === selectedAgent || item.parent_agent === selectedAgent)
      .slice(-6)
      .reverse();
  }, [data.recent_events, selectedAgent]);

  const sortedAgents = useMemo(() => {
    const rows = [...filteredAgents];
    if (agentSort === "name") {
      rows.sort((a, b) => a.agent.localeCompare(b.agent));
      return rows;
    }
    if (agentSort === "progress") {
      rows.sort((a, b) => Number(b.progress ?? 0) - Number(a.progress ?? 0));
      return rows;
    }
    const riskScore = (status: string) => {
      if (status === "error") {
        return 0;
      }
      if (status === "warn") {
        return 1;
      }
      return 2;
    };
    rows.sort((a, b) => {
      const ra = riskScore(String(a.status));
      const rb = riskScore(String(b.status));
      if (ra !== rb) {
        return ra - rb;
      }
      return Number(b.progress ?? 0) - Number(a.progress ?? 0);
    });
    return rows;
  }, [agentSort, filteredAgents]);

  const timelineEvents = useMemo(() => {
    const events = Array.isArray(data.recent_events) ? data.recent_events : [];
    if (selectedAgent) {
      return events
        .filter((item) => item.id === selectedAgent || item.parent_agent === selectedAgent)
        .slice(-timelineLimit)
        .reverse();
    }
    return events.slice(-timelineLimit).reverse();
  }, [data.recent_events, selectedAgent, timelineLimit]);

  function formatTs(ts?: string) {
    if (!ts) {
      return "-";
    }
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) {
      return ts;
    }
    return d.toLocaleString();
  }

  function eventVariant(status?: string): "ok" | "warn" | "error" | "neutral" {
    if (status === "error") {
      return "error";
    }
    if (status === "warn") {
      return "warn";
    }
    if (status === "ok") {
      return "ok";
    }
    return "neutral";
  }

  function eventBoxClass(status?: string): string {
    if (status === "error") {
      return "border-rose-200 bg-rose-50";
    }
    if (status === "warn") {
      return "border-amber-200 bg-amber-50";
    }
    if (status === "ok") {
      return "border-emerald-200 bg-emerald-50";
    }
    return "border-zinc-200 bg-white";
  }

  function makeTimelineDomId(
    evt: NonNullable<MonitorStatus["recent_events"]>[number],
    fallbackIndex: number,
  ): string {
    const raw = `${evt.scope ?? "evt"}-${evt.id ?? "unknown"}-${evt.ts ?? fallbackIndex}`;
    return `timeline-event-${raw.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }

  function focusAgentTimeline(agentId: string) {
    setSelectedAgent(agentId);
    setTimelineFocusId(null);
    setTimelineLimit(20);

    const events = Array.isArray(data.recent_events) ? data.recent_events : [];
    const scoped = events
      .filter((item) => item.id === agentId || item.parent_agent === agentId)
      .slice(-20)
      .reverse();
    const targetId = scoped.length ? makeTimelineDomId(scoped[0], 0) : "event-timeline";

    setTimeout(() => {
      const node = document.getElementById(targetId);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
        if (scoped.length) {
          setTimelineFocusId(targetId);
        }
      }
    }, 60);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-6 lg:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">{t.subtitle}</p>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-sm text-zinc-500">
              {t.generatedAt}: {data.generated_at}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-md border bg-white p-1">
              <Globe size={14} className="text-zinc-500" />
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${lang === "zh" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
                onClick={() => setLang("zh")}
              >
                中
              </button>
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${lang === "en" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
            <Badge variant={data.agent_stalled_count > 0 ? "warn" : "ok"}>
              {t.stalledAgents}={data.agent_stalled_count}
            </Badge>
          </div>
        </div>

        <Card className="border-zinc-300 shadow-sm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <p className="text-lg font-semibold">{t.valueTitle}</p>
            <p className="text-sm text-zinc-600">{t.valueDesc}</p>
          </CardContent>
        </Card>

        <section className="order-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{t.importantModules}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-zinc-300 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle size={16} />
                  {t.focusPanelTitle}
                </CardTitle>
                <CardDescription>{t.focusPanelDesc}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-rose-700">{t.stalledNow}</p>
                  <p className="text-2xl font-bold text-rose-700">{data.agent_stalled_count}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-amber-700">{t.abnormalNow}</p>
                  <p className="text-2xl font-bold text-amber-700">{abnormalCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.priorityList}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {priorityAgents.length ? (
                  priorityAgents.slice(0, 4).map((row) => (
                    <div key={row.agent} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                      <button
                        type="button"
                        onClick={() => focusAgentTimeline(row.agent)}
                        className="truncate text-left text-sm font-medium hover:text-zinc-700"
                      >
                        {row.agent}
                      </button>
                      <Badge variant={row.status === "error" ? "error" : "warn"}>{row.status}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">{t.noPriorityList}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.activeList}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeAgents.length ? (
                  activeAgents.slice(0, 4).map((row) => (
                    <div key={row.agent} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                      <button
                        type="button"
                        onClick={() => focusAgentTimeline(row.agent)}
                        className="truncate text-left text-sm font-medium hover:text-zinc-700"
                      >
                        {row.agent}
                      </button>
                      <span className="text-xs text-zinc-500">{row.progress}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">{t.noActiveList}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers3 size={16} />
                  {t.cardSelection}
                </CardTitle>
                <CardDescription>{t.statusSemantics}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border p-2">
                    <div className="text-lg font-semibold">{data.agent_count}</div>
                    <div className="text-[11px] text-zinc-500">{t.cardAgents}</div>
                  </div>
                  <div className="rounded border p-2">
                    <div className="text-lg font-semibold">{data.subagent_execution.length}</div>
                    <div className="text-[11px] text-zinc-500">{t.cardSubagents}</div>
                  </div>
                  <div className="rounded border p-2">
                    <div className="text-lg font-semibold">{data.agent_aborted_total}</div>
                    <div className="text-[11px] text-zinc-500">{t.cardAborted}</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-zinc-600">
                  <p>{t.semanticIdle}</p>
                  <p>{t.semanticExec}</p>
                  <p>{t.semanticWaiting}</p>
                  <p>{t.semanticStalled}</p>
                  <p>{t.semanticBlocked}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="order-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{t.coreDisplay}</h2>
              <Clock3 size={14} className="text-zinc-400" />
            </div>
            <button
              type="button"
              onClick={() => setSelectedAgent(null)}
              className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
            >
              {t.resetFocus}
            </button>
          </div>

          <Card className="border-zinc-300 shadow-sm">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>{t.agentTableTitle}</CardTitle>
                <CardDescription>{t.tableDesc}</CardDescription>
              </div>

              {selectedAgentRow ? (
                <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 lg:grid-cols-[1.1fr_1fr]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={14} className="text-zinc-500" />
                      <p className="text-sm font-semibold">{t.playbookTitle}</p>
                    </div>
                    <p className="text-xs text-zinc-500">{t.playbookDesc}</p>
                    <div className="space-y-1 text-xs text-zinc-700">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate">1. {t.step1}</p>
                        <button
                          type="button"
                          onClick={() => setViewMode("risk")}
                          className="rounded border bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-100"
                        >
                          {t.stepActionRisk}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate">2. {t.step2}</p>
                        <button
                          type="button"
                          onClick={() => setSubViewMode("failed")}
                          className="rounded border bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-100"
                        >
                          {t.stepActionSubFailed}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate">3. {t.step3}</p>
                        <button
                          type="button"
                          onClick={() => focusAgentTimeline(selectedAgentRow.agent)}
                          className="rounded border bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-100"
                        >
                          {t.stepActionTimeline}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <Badge variant={selectedAgentRow.status === "error" ? "error" : selectedAgentRow.status === "warn" ? "warn" : "ok"}>
                        {selectedAgentRow.status}
                      </Badge>
                      <span className="text-zinc-500">stage={selectedAgentRow.stage}</span>
                      <span className="text-zinc-500">progress={selectedAgentRow.progress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t.recentEventsTitle}</p>
                    <div className="space-y-1">
                      {selectedRecentEvents.length ? (
                        selectedRecentEvents.map((evt, idx) => (
                          <div key={`${evt.ts}-${evt.id}-${idx}`} className="rounded border bg-white px-2 py-1.5 text-xs">
                            <p className="truncate font-medium text-zinc-700">
                              {evt.scope}:{evt.id}
                            </p>
                            <p className="truncate text-zinc-500">
                              {evt.stage ?? "-"} / {typeof evt.progress === "number" ? `${evt.progress}%` : "-"} / {evt.current_task ?? "-"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500">{t.noRecentEvents}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-[auto_1fr]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">{t.viewLabel}</span>
                  <button
                    type="button"
                    onClick={() => setViewMode("all")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${viewMode === "all" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {t.viewAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("risk")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${viewMode === "risk" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {t.viewRisk}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("running")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${viewMode === "running" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {t.viewRunning}
                  </button>
                  <span className="ml-2 text-xs font-medium text-zinc-500">{t.sortLabel}</span>
                  <button
                    type="button"
                    onClick={() => setAgentSort("risk")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${agentSort === "risk" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {t.sortRisk}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentSort("progress")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${agentSort === "progress" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {t.sortProgress}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentSort("name")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${agentSort === "name" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                  >
                    {t.sortName}
                  </button>
                </div>

                <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-1.5">
                  <Search size={14} className="text-zinc-400" />
                  <span className="sr-only">{t.searchLabel}</span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  />
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <AgentTable rows={sortedAgents} />
            </CardContent>
          </Card>
        </section>

        <section className="order-3 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{t.secondaryArea}</h2>

          <Card>
            <CardHeader>
              <CardTitle>{t.subagentTableTitle}</CardTitle>
              <CardDescription>{t.tableDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">{t.subFilterLabel}</span>
                <button
                  type="button"
                  onClick={() => setSubViewMode("all")}
                  className={`rounded-md border px-2.5 py-1 text-xs ${subViewMode === "all" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                >
                  {t.subViewAll}
                </button>
                <button
                  type="button"
                  onClick={() => setSubViewMode("failed")}
                  className={`rounded-md border px-2.5 py-1 text-xs ${subViewMode === "failed" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                >
                  {t.subViewFailed}
                </button>
                <button
                  type="button"
                  onClick={() => setSubViewMode("running")}
                  className={`rounded-md border px-2.5 py-1 text-xs ${subViewMode === "running" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600"}`}
                >
                  {t.subViewRunning}
                </button>
              </div>
              <SubagentTable rows={filteredSubs} />
            </CardContent>
          </Card>

          <Card id="event-timeline">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{t.timelineTitle}</CardTitle>
                  <CardDescription>{t.timelineDesc}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimelineLimit((v) => (v >= 40 ? 12 : 40))}
                    className="rounded-md border px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                  >
                    {timelineLimit >= 40 ? t.timelineShowLess : t.timelineShowMore}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timelineEvents.length ? (
                <div className="space-y-2">
                  {timelineEvents.map((evt, idx) => (
                    <div
                      id={makeTimelineDomId(evt, idx)}
                      key={`${evt.ts}-${evt.id}-${idx}`}
                      className={`grid gap-2 rounded-md border p-3 lg:grid-cols-[190px_1fr] ${eventBoxClass(evt.status)} ${
                        timelineFocusId === makeTimelineDomId(evt, idx) ? "ring-2 ring-zinc-700 ring-offset-1" : ""
                      }`}
                    >
                      <div className="text-xs text-zinc-500">{formatTs(evt.ts)}</div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                          <span>
                            {evt.scope}:{evt.id}
                            {evt.parent_agent ? ` <- ${evt.parent_agent}` : ""}
                          </span>
                          <Badge variant={eventVariant(evt.status)}>{evt.status ?? "neutral"}</Badge>
                        </p>
                        <p className="text-xs text-zinc-500">
                          stage={evt.stage ?? "-"} / progress={typeof evt.progress === "number" ? `${evt.progress}%` : "-"}
                        </p>
                        <p className="truncate text-xs text-zinc-600">{evt.current_task ?? "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">{t.timelineEmpty}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t.chartTitle}</CardTitle>
                    <CardDescription>{t.chartDesc}</CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCharts((v) => !v)}
                    className="rounded-md border px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                  >
                    {showCharts ? t.chartToggleClose : t.chartToggleOpen}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {showCharts ? (
                  <AgentCharts rows={sortedAgents.length ? sortedAgents : data.agent_execution} />
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-zinc-500">{t.chartLazyHint}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t.graphTitle}</CardTitle>
                    <CardDescription>{t.graphDesc}</CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFlow((v) => !v)}
                    className="rounded-md border px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                  >
                    {showFlow ? t.graphToggleClose : t.graphToggleOpen}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {showFlow ? (
                  <AgentFlow agents={sortedAgents.length ? sortedAgents : data.agent_execution} subs={filteredSubs} />
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-zinc-500">{t.graphLazyHint}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
