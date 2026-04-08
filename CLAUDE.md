# CLAUDE.md — MindKit

> 基于 Stello SDK 的本地对话拓扑产品。

---

## 项目定位

MindKit 是 Stello 的本地落地产品，面向终端用户：
- **多 Space**：每个 Space 是一棵独立的 session 树（StelloAgent 实例）
- **Market**：内置预设配置（skills、fork profiles 等），一键创建 Space
- **本地优先**：文件系统持久化，无需数据库

---

## 仓库结构

- `stello/` — git submodule，指向 stello 仓库，通过 pnpm workspace 引用
- `packages/server/` — 本地后端（Hono + WS），核心包
- `packages/web/` — 前端（占位）
- `market/presets/` — 内置预设配置
- `data/` — 运行时数据（gitignore），每个 Space 一个子目录

---

## Stello 复用

Stello 通过 git submodule + pnpm workspace 引用，未发包：
- `pnpm-workspace.yaml` 包含 `stello/packages/*`
- MindKit 包通过 `workspace:^` 依赖 `@stello-ai/core`、`@stello-ai/session` 等
- 修改 stello 代码后两边立即生效

---

## 技术栈

- TypeScript 严格模式 · pnpm monorepo · Vitest · tsup（ESM）
- 后端：Hono + @hono/node-server + ws
- 存储：文件系统（NodeFileSystemAdapter）

---

## 代码规范

- 遵循 stello 的代码规范：interface 通信、中文注释、KISS、严格模式、无 any
- commit 格式：`feat/fix/docs/test/chore(模块名): 简短中文描述`
- push 前先 `git diff --stat` 确认改动范围

---

## 关键设计决策

1. Space = StelloAgent 实例，文件系统持久化在 `data/spaces/{id}/`
2. Space 懒加载——首次 WS 连接时实例化，不全量启动
3. Preset config.json 是声明式的，运行时由 SpaceFactory 构建完整 StelloAgentConfig
4. API key 通过环境变量注入（.env），不存入 config
5. FileSystemMemoryEngine 需在 MindKit 中实现（stello 目前只有 PG 版）
