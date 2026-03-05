# 教程：从 0 到可用（中文）

## 1. 前置要求
- Python 3.10+
- Node.js 20+
- npm 10+
- 可用的 `uv` 命令

## 2. 启动后端
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```

## 3. 启动前端
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm install
npm run prod:build
npm run prod:start
```

## 4. 检查服务
```bash
curl http://127.0.0.1:8787/api/status
curl http://127.0.0.1:3000/api/monitor-status
```

## 5. 日常运维
在 `agent-monitor-ui` 目录中：
```bash
npm run prod:status
npm run prod:logs
npm run prod:restart
npm run prod:stop
```

## 6. 常见问题
- 页面空白：检查 `3000` 端口进程是否存活。
- 数据不刷新：检查 `8787` 是否可访问、Agent 数据源是否更新。
- 状态误判：优先检查 `current_task` 与 `latest_updated_at`。

## 7. 升级流程
1. 拉取代码。
2. 执行 `npm run prod:build`。
3. 执行 `npm run prod:restart`。
4. 用 `/api/status` 验证变更是否生效。

## 8. Skill 部署入口（推荐）
```bash
cd /root/openclaw-monitor-mvp
bash ./scripts/deploy_with_skill.sh
```

可通过环境变量指定 skill 路径：
```bash
OPENCLAW_MONITOR_SKILL_DIR=/root/.openclaw/skills/openclaw-monitor \
  bash ./scripts/deploy_with_skill.sh
```
