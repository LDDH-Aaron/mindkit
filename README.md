# MindKit


## Clone

```bash
git clone --recurse-submodules git@github.com:eddiewjy/MindKit.git
cd MindKit
```

已有仓库但缺少 submodule 时：

```bash
git submodule update --init --recursive
```

## 开发

```bash
# 安装依赖（包括 stello workspace 包）
pnpm install

# 构建 stello 依赖（首次 / stello 代码变更后）
pnpm --filter @stello-ai/session run build && pnpm --filter @stello-ai/core run build

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 测试
pnpm test
```

### 环境变量

复制 `.env.example` 为 `.env`，填入 API key：

```bash
cp .env.example .env
```

## 仓库结构

```
stello/              # git submodule — Stello SDK
packages/
  server/            # 本地后端（Hono + WS）
  web/               # 前端（开发中）
market/presets/      # 内置预设配置
data/                # 运行时数据（gitignore）
```
