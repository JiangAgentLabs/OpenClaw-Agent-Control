# OpenClaw Monitor MVP

最小可用监控页：启动后通过网页查看 OpenClaw agent 与任务状态，纯内存缓存，不引入数据库。

## 功能

- `GET /dashboard`
  - 页面展示：
    - Agent 执行概览：`sessions`、`aborted_last_run`、`latest_updated_at`
    - 任务总计：`in_progress/backlog/assignments/testing/done`
    - 多 workspace 任务计数（同时统计 `workspace` 与 `workspace-*`）
    - 卡住任务告警（`work/in-progress` 中超过阈值未更新）
- `GET /api/status`
  - 返回同源 JSON 数据
- 自动刷新（默认 5 秒）
- 内存缓存（默认 15 秒）

## 运行

```bash
cd /root/openclaw-monitor-mvp
python3 -m uvicorn app:app --host 0.0.0.0 --port 8787
```

访问：

- http://127.0.0.1:8787/dashboard
- http://127.0.0.1:8787/api/status

## 配置

- `OPENCLAW_HOME`：默认 `/root/.openclaw`
- `CACHE_TTL_SECONDS`：默认 `15`
- `DASHBOARD_REFRESH_SECONDS`：默认 `5`
- `TASK_STALL_SECONDS`：默认 `60`（超过 60 秒未更新的 in-progress 任务视为异常）
- `OFFICIAL_STATUS_ENABLED`：默认 `1`（采集 `openclaw health/status`）
- `OFFICIAL_STATUS_TIMEOUT_SECONDS`：默认 `8`

示例：

```bash
OPENCLAW_HOME=/root/.openclaw CACHE_TTL_SECONDS=10 \
python3 -m uvicorn app:app --host 0.0.0.0 --port 8787
```

## 说明

- 任务计数来自 `workspace/work/*` 与 `workspace-*/work/*` 目录中文件数（一级目录，不递归）。
- Agent 数据来自 `agents/*/sessions/sessions.json`。
- `latest_updated_at` 为 UTC ISO 时间。
- 可选采集官方状态：`openclaw health --json`、`openclaw status --json --usage`，并追加 Gateway API 探针（`/tools/invoke`）。
- Skill 版本已放在：`/root/.openclaw/skills/openclaw-monitor`
  - 启动：`bash /root/.openclaw/skills/openclaw-monitor/scripts/run_monitor.sh`

## 语言切换

- 中文：`/dashboard?lang=zh`
- English：`/dashboard?lang=en`
