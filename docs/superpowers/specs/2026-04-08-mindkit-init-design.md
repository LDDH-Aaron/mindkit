# MindKit 初始化设计

> 基于 Stello SDK 的本地对话拓扑产品。本文档覆盖仓库初始化、后端架构、Stello 复用形式。

---

## 项目定位

MindKit 是 Stello 的本地落地产品。类似 devtools 的本地服务器形态，但面向终端用户而非开发者调试：
- **多 Space**：每个 Space 是一棵独立的 session 树（对应一个 StelloAgent 实例）
- **Market**：内置预设配置（skills、fork profiles、LLM 配置等），一键创建 Space

---

## Stello 复用形式

- **git submodule**：`stello/` 目录指向 stello 仓库
- **workspace 引用**：`pnpm-workspace.yaml` 包含 `stello/packages/*`，MindKit 包通过 `workspace:^` 直接依赖 stello 各包
- **理由**：Stello 未发包且快速迭代，submodule + workspace 可以改一处两边立即生效

---

## 仓库结构

```
~/Code/MindKit/
├── stello/                      # git submodule
│   └── packages/{session,core,server,devtools,visualizer}
├── packages/
│   ├── server/                  # MindKit 本地后端
│   │   ├── src/
│   │   │   ├── index.ts         # 入口：启动 Hono server
│   │   │   ├── space/           # Space 管理（CRUD、持久化）
│   │   │   ├── market/          # Market：读取预设、创建 Agent
│   │   │   ├── routes/          # HTTP routes
│   │   │   └── ws/              # WebSocket handler
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   └── web/                     # 前端占位
│       └── package.json
├── market/
│   └── presets/                 # 内置预设目录
├── data/                        # 运行时数据（gitignore）
│   └── spaces/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'stello/packages/*'
  - 'stello/packages/devtools/web'
```

---

## server 包设计

### 技术栈

Hono + `@hono/node-server` + `ws`，与 devtools 同栈。

### 核心职责

| 职责 | 说明 |
|------|------|
| Space CRUD | 创建/列举/删除 Space，每个 Space 对应一棵 session 树 |
| Agent 生命周期 | 每个 Space 持有一个 StelloAgent 实例，按需懒加载 |
| 对话转发 | 接收用户消息 → 路由到对应 Space 的 Agent → 返回响应 |
| Market | 读取预设配置，基于预设创建新 Space |
| 文件持久化 | `data/spaces/{spaceId}/` 下存储 session 树、L3、L2 等 |

### REST API

```
GET    /api/spaces              # 列举所有 Space
POST   /api/spaces              # 创建 Space（可指定 preset）
DELETE /api/spaces/:id          # 删除 Space
GET    /api/market/presets       # 列举可用预设
WS     /ws/spaces/:id           # 连接到指定 Space 进行对话
```

WebSocket 消息协议参考 devtools 的事件模式，但需适配多 Space 场景——devtools 的 event bus 面向单 Agent 广播，MindKit 的 `/ws/spaces/:id` 需要 per-Space 路由，每个 WS 连接绑定到特定 Space。

---

## Space 与 StelloAgent 的映射

### 数据目录

```
data/spaces/{spaceId}/
├── config.json      # Space 可序列化配置（见下文）
├── sessions/        # SessionTreeImpl(NodeFileSystemAdapter) 数据目录
└── state.json       # 活跃 session ID、上次访问时间等
```

### config.json 与运行时构建

`StelloAgentConfig` 大部分字段（SessionTree、MemoryEngine、capabilities）是运行时对象，不可直接序列化。`config.json` 只存声明式配置，运行时由 `SpaceFactory` 构建完整的 `StelloAgentConfig`：

```
config.json (声明式)          SpaceFactory (运行时构建)
─────────────────────         ─────────────────────────────
systemPrompt: "..."      →   capabilities.lifecycle
forkProfiles: [...]       →   capabilities.profiles
skills: ["..."]           →   capabilities.skills (SkillRouter)
llm: { model, ... }      →   LLMAdapter (via createClaude/createGPT)
                          →   SessionTree (new SessionTreeImpl + NodeFileSystemAdapter)
                          →   MemoryEngine (new FileSystemMemoryEngine)
                          →   consolidateFn (createDefaultConsolidateFn)
                          →   integrateFn (createDefaultIntegrateFn)
```

参考 stello server 的 `AgentPool.buildConfig` 模式。

### 需要实现的 Stello 缺失件

**FileSystemMemoryEngine**：Stello 目前只有 PG 版 `MemoryEngine`（在 server 包中）。MindKit 需要实现文件系统版本，接口约 8 个方法（readCore、writeCore、readMemory、writeMemory、readScope 等），使用 `NodeFileSystemAdapter` 实现。可以先放在 MindKit server 包中，成熟后上提到 stello core。

### LLM 适配与 API Key 管理

- Preset 的 `llm.model` 字段决定使用哪个 adapter factory（`createClaude` / `createGPT` / `createAnthropicAdapter`）
- API key 来源：环境变量（`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`），不存入 config.json
- `SpaceFactory` 根据 model 前缀选择 adapter，注入 key

### ConsolidateFn / IntegrateFn

使用 stello core 导出的 `createDefaultConsolidateFn` 和 `createDefaultIntegrateFn`，传入 prompt 字符串和 LLM 调用函数。Preset 可自定义 prompt，否则用默认值。

### Space 创建流程

1. 从 preset 复制 config.json 到 `data/spaces/{id}/`
2. 调用 `SessionTreeImpl.createRoot()` 初始化根 session
3. 首次 WS 连接时 `SpaceFactory` 从 config.json 构建完整 `StelloAgentConfig` → 实例化 `StelloAgent`

### 关键设计点

1. **懒加载**：Space 首次 WS 连接时才实例化 StelloAgent，不全量启动
2. **存储适配**：每个 Space 使用 `SessionTreeImpl` + `NodeFileSystemAdapter`，指向 `data/spaces/{id}/sessions/`
3. **卸载策略**：暂不实现，后续按需加 LRU

### Preset 格式

```json
{
  "name": "研究助手",
  "description": "...",
  "systemPrompt": "你是一个研究助手...",
  "forkProfiles": [],
  "skills": ["summarize", "deep-research"],
  "llm": { "model": "claude-sonnet-4-20250514" },
  "consolidatePrompt": null,
  "integratePrompt": null
}
```

`consolidatePrompt` / `integratePrompt` 为 null 时使用 stello 默认 prompt。

---

## 设计决策

1. Stello 通过 git submodule + workspace 引用，不发包
2. 后端 Hono + WS，与 devtools 同栈
3. 文件系统持久化，每个 Space 独立目录
4. Market 先本地内置预设，后续扩展远程
5. 前端 `packages/web/` 占位，后续开发
6. Space 懒加载，不全量实例化
7. FileSystemMemoryEngine 需在 MindKit 中实现（stello 缺失件）
8. API key 通过环境变量注入，不存入 config
9. ConsolidateFn/IntegrateFn 使用 stello 默认实现，preset 可自定义 prompt
