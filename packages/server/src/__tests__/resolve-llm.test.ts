import { describe, it, expect } from 'vitest'
import { resolveLLM, toLLMCallFn } from '../llm/resolve-llm'

describe('resolveLLM', () => {
  const env = {
    OPENAI_API_KEY: 'test-openai-key',
    OPENAI_BASE_URL: 'https://api.minimaxi.com/v1',
  }

  it('creates adapter for any model when OPENAI_API_KEY is set', () => {
    const adapter = resolveLLM('claude-sonnet-4-20250514', env)
    expect(adapter).toBeDefined()
    expect(adapter.maxContextTokens).toBeGreaterThan(0)
  })

  it('creates adapter for gpt-* models', () => {
    const adapter = resolveLLM('gpt-4o', env)
    expect(adapter).toBeDefined()
    expect(adapter.maxContextTokens).toBeGreaterThan(0)
  })

  it('creates adapter for o3-* models', () => {
    const adapter = resolveLLM('o3-mini', env)
    expect(adapter).toBeDefined()
  })

  it('creates adapter for o4-* models', () => {
    const adapter = resolveLLM('o4-mini', env)
    expect(adapter).toBeDefined()
  })

  it('creates adapter for custom models (e.g. MiniMax)', () => {
    const adapter = resolveLLM('MiniMax-M2.7', env)
    expect(adapter).toBeDefined()
  })

  it('throws when OPENAI_API_KEY is missing', () => {
    expect(() => resolveLLM('gpt-4o', {})).toThrow('OPENAI_API_KEY')
  })

  it('respects OPENAI_MAX_CONTEXT_TOKENS env var', () => {
    const adapter = resolveLLM('test-model', {
      ...env,
      OPENAI_MAX_CONTEXT_TOKENS: '50000',
    })
    expect(adapter.maxContextTokens).toBe(50000)
  })
})

describe('toLLMCallFn', () => {
  it('wraps LLMAdapter.complete into a LLMCallFn returning content', async () => {
    const mockAdapter = {
      maxContextTokens: 100_000,
      complete: async () => ({ content: 'test response' }),
    }
    const callFn = toLLMCallFn(mockAdapter)
    const result = await callFn([{ role: 'user', content: 'hello' }])
    expect(result).toBe('test response')
  })

  it('returns empty string when content is null', async () => {
    const mockAdapter = {
      maxContextTokens: 100_000,
      complete: async () => ({ content: null }),
    }
    const callFn = toLLMCallFn(mockAdapter)
    const result = await callFn([{ role: 'user', content: 'hello' }])
    expect(result).toBe('')
  })
})
