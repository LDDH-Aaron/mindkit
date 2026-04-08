import { describe, it, expect } from 'vitest'
import { resolveLLM, toLLMCallFn } from '../llm/resolve-llm'

describe('resolveLLM', () => {
  const env = {
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    OPENAI_API_KEY: 'test-openai-key',
  }

  it('routes claude-* models to an adapter with maxContextTokens', () => {
    const adapter = resolveLLM('claude-sonnet-4-20250514', env)
    expect(adapter).toBeDefined()
    expect(adapter.maxContextTokens).toBeGreaterThan(0)
  })

  it('routes gpt-* models to an adapter', () => {
    const adapter = resolveLLM('gpt-4o', env)
    expect(adapter).toBeDefined()
    expect(adapter.maxContextTokens).toBeGreaterThan(0)
  })

  it('routes o3-* models to an adapter', () => {
    const adapter = resolveLLM('o3-mini', env)
    expect(adapter).toBeDefined()
  })

  it('routes o4-* models to an adapter', () => {
    const adapter = resolveLLM('o4-mini', env)
    expect(adapter).toBeDefined()
  })

  it('throws for unknown model prefix', () => {
    expect(() => resolveLLM('llama-3', env)).toThrow('Unsupported model')
  })

  it('throws with env var name when ANTHROPIC_API_KEY is missing', () => {
    expect(() => resolveLLM('claude-sonnet-4-20250514', {})).toThrow('ANTHROPIC_API_KEY')
  })

  it('throws with env var name when OPENAI_API_KEY is missing', () => {
    expect(() => resolveLLM('gpt-4o', {})).toThrow('OPENAI_API_KEY')
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
