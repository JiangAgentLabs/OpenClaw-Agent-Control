export type MonitorStatus = {
  generated_at: string;
  agent_count: number;
  agent_stalled_count: number;
  agent_sessions_total: number;
  agent_aborted_total: number;
  agent_execution: Array<{
    agent: string;
    status: "ok" | "warn" | "error" | string;
    stage: string;
    progress: number;
    sessions: number;
    aborted_last_run: number;
    age_text: string;
    current_session_key: string;
    current_task?: string;
    token_total: number;
  }>;
  subagent_execution: Array<{
    parent_agent: string;
    agent: string;
    status: "ok" | "warn" | "error" | string;
    stage: string;
    progress: number;
    current_task: string;
    runtime: string;
    result: string;
  }>;
  recent_events?: Array<{
    ts: string;
    scope: "agent" | "subagent" | string;
    id: string;
    parent_agent?: string;
    status?: string;
    stage?: string;
    progress?: number;
    current_task?: string;
    age_text?: string;
    runtime?: string;
    result?: string;
  }>;
};
