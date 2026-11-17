# 老年康复辅助平台（老人端）

面向康复期老年人的移动端 H5 网页：康复进度查看、每日任务打卡、求助留言、心理关怀、适老化字体设置。

- 架构设计详见：[老年康复辅助平台-老人端-轻量架构设计.md](./老年康复辅助平台-老人端-轻量架构设计.md)
- 团队分工与协作规范详见：[docs/团队分工与协作规范.md](./docs/团队分工与协作规范.md)

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | Vue 3 + Vite + Vue Router + axios + jQuery（局部交互） |
| 后端 | Node.js + Express + bcryptjs + jsonwebtoken + dayjs |
| 数据 | 本地 JSON 文件（`server/data/*.json`，Repository 层封装） |

## 目录结构

```
├─ client/   # 前端 Vue3 工程
├─ server/   # 后端 Express 工程
└─ docs/     # 分工与协作文档
```

## 快速启动

### 1. 后端（端口 3000）

```bash
cd server
npm install
copy .env.example .env   # Windows；macOS/Linux 用 cp
npm run start            # 或 npm run dev（nodemon 热重载）
```

### 2. 前端（端口 5173，局域网手机可访问）

```bash
cd client
npm install
npm run dev -- --host
```

浏览器访问 `http://localhost:5173`，手机访问终端提示的 Network 地址。

如需启用个人中心的一键拨号，在 `client/.env.development.local` 配置经团队确认的 `VITE_EMERGENCY_PHONE`。未配置时拨号按钮会禁用；不要猜测号码或提交真实号码。

## 协作流程速查

1. 从 `dev` 拉出自己的功能分支：`git checkout -b feat/xxx`
2. 开发 → 提交（`feat/fix/docs: 说明`）→ push
3. 发 PR 到 `dev`，找 1 名队友 review 后合入
4. 每阶段集成的里程碑见分工文档第四节
