# OpenClaw Agent Control（中文）

OpenClaw Agent 状态监控与控制台，面向多 Agent 运行场景。

## 适用场景
- 需要快速判断 Agent 是否卡住、阻塞、空闲或执行中。
- 需要把状态监控与操作决策放在同一界面。
- 需要前后端可独立部署、可运维脚本化的方案。

## 核心能力
- Agent / Sub-agent 执行状态监控。
- 风险优先视图（告警、异常、活跃）。
- 事件时间轴与状态演化追踪。
- 生产脚本支持静默启动与生命周期管理。

## 快速运行
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
- 教程（中文）：[docs/TUTORIAL.zh-CN.md](./docs/TUTORIAL.zh-CN.md)
- API 文档：[docs/API.md](./docs/API.md)
- 开源项目对标：[docs/OPEN_SOURCE_LANDSCAPE.md](./docs/OPEN_SOURCE_LANDSCAPE.md)
- 贡献指南：[CONTRIBUTING.md](./CONTRIBUTING.md)
