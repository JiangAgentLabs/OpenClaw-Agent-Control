# OpenClaw Agent Control（中文）

OpenClaw Agent 状态监控与控制台，面向多 Agent 运行场景。

## 项目定义
本项目用于把 Agent 运行状态监控与控制决策集中到一个运维控制台中。

## 项目优势
- 运维优先的信息架构：核心展示区在前，分析区在后。
- 状态语义清晰：`idle`、`executing`、`waiting`、`stalled`、`blocked`。
- Skill 优先部署：一条命令完成后端+前端拉起。
- 运维成本低：脚本化生命周期管理（启动/停止/重启/状态/日志）。
- 双语文档：支持中文和英文团队快速接入。

## 核心功能
- Agent / Sub-agent 实时状态监控。
- 风险优先视图（卡住、异常、活跃）。
- 事件时间轴与状态演化分析。
- 前后端生产运维脚本（启动/停止/重启/状态/日志）。
- 与 OpenClaw Skills 集成的一键部署入口。

## 一键部署（Skill 集成）
后续可直接通过包装好的 skill 完成部署与启动。

先安装 skill（npm 命令）：
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run skill:install
```

再部署启动：
```bash
cd /root/openclaw-monitor-mvp
bash ./scripts/deploy_with_skill.sh
```

说明：
- 若存在 skill 运行器（`/root/.openclaw/skills/openclaw-monitor/scripts/run_monitor.sh`），后端将优先通过 skill 拉起。
- 前端会自动执行生产构建并重启。

## 快速运行（手动）
1. 启动后端：
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```
2. 启动前端：
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run prod:build
npm run prod:start
```
3. 访问地址：
- 控制台：`http://127.0.0.1:3000`
- 状态接口：`http://127.0.0.1:8787/api/status`
- 后端看板：`http://127.0.0.1:8787/dashboard`

## 文档导航
- 英文文档：[README.en.md](./README.en.md)
- About 说明：[docs/ABOUT.md](./docs/ABOUT.md)
- 教程（中文）：[docs/TUTORIAL.zh-CN.md](./docs/TUTORIAL.zh-CN.md)
- API 文档：[docs/API.md](./docs/API.md)
- 贡献指南：[CONTRIBUTING.md](./CONTRIBUTING.md)
