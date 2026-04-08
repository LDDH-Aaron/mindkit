import { createOpenAICompatibleAdapter } from '@stello-ai/core'
import type { LLMCallFn } from '@stello-ai/core'
import type { LLMAdapter } from '@stello-ai/session'

/**
 * 完全对齐 devtools 的 LLM 配置模式。
 * 环境变量：OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, OPENAI_MAX_CONTEXT_TOKENS
 * preset.json 中的 llm.model 作为 fallback，环境变量优先。
 */
export function resolveLLM(
  presetModel: string,
  env: Record<string, string | undefined>,
): LLMAdapter {
  const apiKey = env['OPENAI_API_KEY']
  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY\n' +
      '  export OPENAI_BASE_URL=https://api.minimaxi.com/v1\n' +
      '  export OPENAI_API_KEY=your_key\n' +
      '  export OPENAI_MODEL=MiniMax-M2.7',
    )
  }

  const baseURL = env['OPENAI_BASE_URL'] ?? 'https://api.minimaxi.com/v1'
  const model = env['OPENAI_MODEL'] ?? presetModel
  const maxContextTokens = Number(env['OPENAI_MAX_CONTEXT_TOKENS'] ?? 1_000_000)

  return createOpenAICompatibleAdapter({ apiKey, baseURL, model, maxContextTokens })
}

/** 将 LLMAdapter 包装为 LLMCallFn（供 createDefaultConsolidateFn/IntegrateFn 使用） */
export function toLLMCallFn(adapter: LLMAdapter): LLMCallFn {
  return async (messages) => {
    const result = await adapter.complete(
      messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    )
    return result.content ?? ''
  }
}
