# OpenClaw Agent Control（中文说明）

OpenClaw Agent 状态监控与控制台。

## 功能概览
- Agent / Sub-agent 执行状态监控
- 风险优先视图（卡住、异常、活跃）
- 事件时间轴与状态追踪
- 前后端分离：FastAPI + Next.js
- 生产脚本：静默启动、停止、重启、状态检查、日志查看

## 运行方式

### 1) 后端
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```

### 2) 前端
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run prod:build
npm run prod:start
```

### 3) 访问地址
- 前端控制台：`http://127.0.0.1:3000`
- 后端接口：`http://127.0.0.1:8787/api/status`
- 后端看板：`http://127.0.0.1:8787/dashboard`

## 前端运维命令
在 `agent-monitor-ui` 目录执行：

```bash
npm run prod:build
npm run prod:start
npm run prod:stop
npm run prod:restart
npm run prod:status
npm run prod:logs
npm run prod:deploy
```

## 配置项
- `OPENCLAW_HOME` 默认 `/root/.openclaw`
- `CACHE_TTL_SECONDS` 默认 `15`
- `DASHBOARD_REFRESH_SECONDS` 默认 `5`
- `TASK_STALL_SECONDS` 默认 `60`
- `OFFICIAL_STATUS_ENABLED` 默认 `1`
- `OFFICIAL_STATUS_TIMEOUT_SECONDS` 默认 `8`

## 状态语义
- `idle`: 无任务，正常空闲
- `executing`: 正在执行
- `waiting`: 队列等待（正常）
- `stalled`: 超时未更新（告警）
- `blocked`: 中止/失败（错误）
