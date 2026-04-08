FROM node:22-slim AS base
RUN corepack enable pnpm

WORKDIR /app

# 复制依赖定义
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY stello/packages/core/package.json stello/packages/core/
COPY stello/packages/session/package.json stello/packages/session/
COPY stello/packages/devtools/web/package.json stello/packages/devtools/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY stello/ stello/
COPY packages/ packages/
COPY market/ market/

# 构建（顺序：session → core → server + web）
RUN pnpm --filter @stello-ai/session run build && \
    pnpm --filter @stello-ai/core run build && \
    pnpm --filter @mindkit/server run build && \
    pnpm --filter @mindkit/web run build

# 确保 data 目录存在
RUN mkdir -p data/spaces

ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "packages/server/dist/index.js"]
