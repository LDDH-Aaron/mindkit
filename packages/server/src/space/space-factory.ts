import {
  createStelloAgent,
  NodeFileSystemAdapter,
  SessionTreeImpl,
  FileSystemMemoryEngine,
  SkillRouterImpl,
  ForkProfileRegistryImpl,
  ToolRegistryImpl,
  Scheduler,
  createDefaultConsolidateFn,
  createDefaultIntegrateFn,
  DEFAULT_CONSOLIDATE_PROMPT,
  DEFAULT_INTEGRATE_PROMPT,
  InMemoryStorageAdapter,
  loadSession,
  loadMainSession,
  buildSessionToolList,
} from '@stello-ai/core'
import type {
  StelloAgentConfig,
  EngineLifecycleAdapter,
  MemoryEngine,
  StelloAgent,
} from '@stello-ai/core'
import type { ConfirmProtocol } from '@stello-ai/core'
import * as crypto from 'node:crypto'
import type { PresetConfig } from '../preset/preset-loader'
import type { SpaceMeta } from './space-manager'
import type { EventBus } from '../events/event-bus'
import { resolveLLM, toLLMCallFn } from '../llm/resolve-llm'

/** SpaceFactory 构建所需的上下文 */
export interface SpaceFactoryContext {
  /** Space 数据目录（如 data/spaces/{id}） */
  dataDir: string
  /** preset 配置（从 config.json 读取） */
  config: PresetConfig
  /** 环境变量（API key 等） */
  env: Record<string, string | undefined>
  /** Space 级配置覆盖 */
  spaceMeta?: SpaceMeta
  /** Space 级事件总线（可选） */
  eventBus?: EventBus
}

/** 从 MemoryEngine 恢复 session 运行态到 InMemoryStorageAdapter */
async function hydrateSession(
  storage: InMemoryStorageAdapter,
  memory: MemoryEngine,
  sessionId: string,
  label: string,
  role: 'standard' | 'main',
  systemPrompt: string,
): Promise<void> {
  const now = new Date().toISOString()
  // 注册 session 元数据到运行态存储
  await storage.putSession({
    id: sessionId,
    label,
    role,
    status: 'active',
    tags: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  })
  await storage.putSystemPrompt(sessionId, systemPrompt)

  // 恢复 L3 对话记录
  const records = await memory.readRecords(sessionId).catch(() => [])
  for (const record of records) {
    await storage.appendRecord(sessionId, {
      role: record.role,
      content: record.content,
      timestamp: record.timestamp,
      ...(record.metadata?.toolCallId && typeof record.metadata.toolCallId === 'string'
        ? { toolCallId: record.metadata.toolCallId }
        : {}),
      ...(Array.isArray(record.metadata?.toolCalls)
        ? { toolCalls: record.metadata.toolCalls as Array<{ id: string; name: string; input: Record<string, unknown> }> }
        : {}),
    })
  }

  // 恢复 L2 memory
  const l2 = await memory.readMemory(sessionId).catch(() => null)
  if (l2) await storage.putMemory(sessionId, l2)

  // 恢复 scope 作为 insight
  const scope = await memory.readScope(sessionId).catch(() => null)
  if (scope) await storage.putInsight(sessionId, scope)
}

/** 将 preset config 组装为完整 StelloAgentConfig，创建 StelloAgent */
export function createSpaceAgent(ctx: SpaceFactoryContext): StelloAgent {
  // NodeFileSystemAdapter base = Space 根目录（SessionTreeImpl 内部用 sessions/ 前缀）
  const fs = new NodeFileSystemAdapter(ctx.dataDir)
  const sessions = new SessionTreeImpl(fs)
  const memory = new FileSystemMemoryEngine(fs, sessions)

  // 共享的运行态存储（InMemoryStorageAdapter 作为 session 组件的运行时存储）
  const sessionStorage = new InMemoryStorageAdapter()

  // LLM: 环境变量 LLM_MODEL 优先，preset 的 llm.model 作为 fallback
  const model = ctx.env['LLM_MODEL'] ?? ctx.config.llm.model
  const llmAdapter = resolveLLM(model, ctx.env)
  const llmCallFn = toLLMCallFn(llmAdapter)

  // Skills: preset first, then space-level override
  const skillRouter = new SkillRouterImpl()
  for (const skill of ctx.config.skills) {
    skillRouter.register(skill)
  }
  if (ctx.spaceMeta?.skills) {
    for (const skill of ctx.spaceMeta.skills) {
      skillRouter.register(skill)
    }
  }

  // Fork profiles: preset first, then space-level override
  const profiles = new ForkProfileRegistryImpl()
  for (const fp of ctx.config.forkProfiles) {
    profiles.register(fp.name, {
      systemPrompt: fp.systemPrompt,
      systemPromptMode: fp.systemPromptMode,
      context: fp.context,
      skills: fp.skills,
    })
  }
  if (ctx.spaceMeta?.presetSessions) {
    for (const fp of ctx.spaceMeta.presetSessions) {
      profiles.register(fp.name, {
        systemPrompt: fp.systemPrompt,
        systemPromptMode: 'prepend',
        skills: fp.skills,
      })
    }
  }

  // 空 ToolRegistry（内置 tool 由 Engine 管理）
  const toolRegistry = new ToolRegistryImpl()
  const sessionTools = buildSessionToolList(toolRegistry, skillRouter, profiles)

  // Lifecycle
  const lifecycle: EngineLifecycleAdapter = {
    /** bootstrap 时组装上下文并返回 session 元数据 */
    bootstrap: async (sessionId) => ({
      context: await memory.assembleContext(sessionId),
      session: (await sessions.get(sessionId))!,
    }),
    /** afterTurn 时追加 L3 记录并更新 turnCount */
    afterTurn: async (sessionId, userMsg, assistantMsg) => {
      await memory.appendRecord(sessionId, userMsg)
      await memory.appendRecord(sessionId, assistantMsg)
      const current = await sessions.get(sessionId)
      if (current) {
        await sessions.updateMeta(sessionId, { turnCount: current.turnCount + 1 })
      }
      return { coreUpdated: false, memoryUpdated: false, recordAppended: true }
    },
  }

  // Tools — 用户自定义 tool（空），内置 tool 由 Engine 自动注入

  // Confirm — 自动批准 split（用延迟引用 agent，与 demo 模式一致）
  let agentRef: StelloAgent | null = null
  const confirm: ConfirmProtocol = {
    /** 自动批准拆分建议，通过 agent.forkSession 创建子 session */
    confirmSplit: async (proposal) => {
      if (!agentRef) throw new Error('Agent not initialized')
      return agentRef.forkSession(proposal.parentId, {
        label: proposal.suggestedLabel,
        scope: proposal.suggestedScope,
      })
    },
    dismissSplit: async () => {},
    confirmUpdate: async () => {},
    dismissUpdate: async () => {},
  }

  // ConsolidateFn / IntegrateFn
  const consolidatePrompt = ctx.config.consolidatePrompt ?? DEFAULT_CONSOLIDATE_PROMPT
  const integratePrompt = ctx.config.integratePrompt ?? DEFAULT_INTEGRATE_PROMPT

  const config: StelloAgentConfig = {
    sessions,
    memory,
    session: {
      /** 按 sessionId 解析真实 Session，先恢复运行态再加载 */
      sessionResolver: async (sessionId) => {
        const meta = await sessions.get(sessionId)
        if (!meta) throw new Error(`Session not found: ${sessionId}`)
        await hydrateSession(
          sessionStorage,
          memory,
          sessionId,
          meta.label,
          'standard',
          ctx.config.systemPrompt,
        )
        const session = await loadSession(sessionId, {
          storage: sessionStorage,
          llm: llmAdapter,
          tools: [...sessionTools],
        })
        if (!session) throw new Error(`Failed to load session: ${sessionId}`)
        return session
      },
      /** 解析 Main Session，先恢复运行态再加载 */
      mainSessionResolver: async () => {
        let root: { id: string; label: string }
        try {
          root = await sessions.getRoot()
        } catch {
          // 根 session 不存在时创建
          root = await (sessions as SessionTreeImpl).createRoot('Main')
        }
        await hydrateSession(
          sessionStorage,
          memory,
          root.id,
          root.label,
          'main',
          ctx.config.systemPrompt,
        )
        const mainSession = await loadMainSession(root.id, {
          storage: sessionStorage,
          llm: llmAdapter,
          tools: [...sessionTools],
        })
        if (!mainSession) throw new Error('Failed to load main session')
        // 包装 integrate，将结果同步回 MemoryEngine（持久化 synthesis + insights）
        return {
          integrate: async (fn: Parameters<typeof mainSession.integrate>[0]) => {
            const result = await mainSession.integrate(fn)
            if (result) {
              await memory.writeMemory(root.id, result.synthesis)
              for (const { sessionId, content } of result.insights) {
                await memory.writeScope(sessionId, content)
              }
            }
            return result
          },
        }
      },
      consolidateFn: createDefaultConsolidateFn(consolidatePrompt, llmCallFn),
      integrateFn: createDefaultIntegrateFn(integratePrompt, llmCallFn),
    },
    capabilities: {
      lifecycle,
      tools: toolRegistry,
      skills: skillRouter,
      confirm,
      profiles,
    },
    orchestration: {
      scheduler: new Scheduler({
        consolidation: { trigger: 'everyNTurns', everyNTurns: 3 },
        integration: { trigger: 'afterConsolidate' },
      }),
      hooks: {
        /** 每轮结束时将 L3 记录持久化到 MemoryEngine */
        onRoundEnd({ sessionId, input, turn }) {
          const userRecord = {
            role: 'user' as const,
            content: input,
            timestamp: new Date().toISOString(),
          }
          const assistantRecord = {
            role: 'assistant' as const,
            content: turn.finalContent ?? turn.rawResponse,
            timestamp: new Date().toISOString(),
          }
          lifecycle.afterTurn(sessionId, userRecord, assistantRecord).catch(() => {})
        },
        onSessionFork({ parentId, child }) {
          if (ctx.eventBus) {
            ctx.eventBus.emit({
              id: crypto.randomUUID(),
              at: new Date().toISOString(),
              kind: 'node_forked',
              payload: { nodeId: child.id, label: child.label, parentId },
            })
          }
        },
      },
    },
  }

  const agent = createStelloAgent(config)
  agentRef = agent

  // 确保根 session 存在（topology 端点在首次对话前就需要读取）
  sessions.getRoot().catch(async () => {
    await (sessions as SessionTreeImpl).createRoot('Main')
  })

  return agent
}
