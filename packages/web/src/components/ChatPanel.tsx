import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import {
  Terminal,
  ArrowUp,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { enterSession, sendTurn, fetchRecords } from '@/lib/api'
import type { TurnRecord } from '@/lib/types'

/* ─── ChatItem 类型系统（复刻 devtools） ─── */

interface ToolCallInfo {
  id: string
  name: string
  args: string
  result?: string
  success?: boolean
  duration?: number
}

interface TurnStats {
  toolRoundCount: number
  toolCallsExecuted: number
}

interface ChatTextItem {
  id: string
  kind: 'user' | 'assistant'
  content: string
  streaming?: boolean
  turnStats?: TurnStats
}

interface ChatToolItem {
  id: string
  kind: 'tool'
  toolCall: ToolCallInfo
}

type ChatItem = ChatTextItem | ChatToolItem

/* ─── 工具函数 ─── */

/** 解析 tool record 的 JSON 负载 */
function parseToolRecordContent(content: string): {
  toolName: string; args: Record<string, unknown>
  success: boolean; data: unknown; error: string | null
} | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    return {
      toolName: typeof parsed.toolName === 'string' ? parsed.toolName : 'tool_result',
      args: typeof parsed.args === 'object' && parsed.args ? parsed.args as Record<string, unknown> : {},
      success: Boolean(parsed.success),
      data: parsed.data,
      error: typeof parsed.error === 'string' ? parsed.error : null,
    }
  } catch { return null }
}

/** 从 assistant record 中抽取结构化的工具调用 */
function extractToolCalls(record: TurnRecord): ToolCallInfo[] {
  if (!Array.isArray(record.metadata?.toolCalls)) return []
  return record.metadata!.toolCalls.map((tc) => ({
    id: tc.id,
    name: tc.name,
    args: JSON.stringify(tc.input, null, 2),
  }))
}

/** 把 L3 records 还原成按时序渲染的时间线（复刻 devtools buildHistoryItems） */
function buildHistoryItems(records: TurnRecord[]): ChatItem[] {
  const items: ChatItem[] = []
  const toolItemsById = new Map<string, ChatToolItem>()

  for (const [index, record] of records.entries()) {
    if (record.role === 'user') {
      items.push({ id: `hist-${index}`, kind: 'user', content: record.content ?? '' })
      continue
    }
    if (record.role === 'tool') {
      const parsed = parseToolRecordContent(record.content ?? '')
      const toolCallId = record.metadata?.toolCallId
      const matched = toolCallId ? toolItemsById.get(toolCallId) : undefined
      if (parsed && matched) {
        matched.toolCall.result = parsed.error
          ? parsed.error
          : parsed.data !== undefined ? JSON.stringify(parsed.data, null, 2) : undefined
        matched.toolCall.success = parsed.success
        matched.toolCall.name = parsed.toolName
        if (matched.toolCall.args.trim().length === 0) {
          matched.toolCall.args = JSON.stringify(parsed.args, null, 2)
        }
        continue
      }
      const fallback: ChatToolItem = {
        id: `hist-${index}`, kind: 'tool',
        toolCall: {
          id: toolCallId ?? `tool-result-${index}`,
          name: parsed?.toolName ?? 'tool_result',
          args: JSON.stringify(parsed?.args ?? {}, null, 2),
          result: parsed?.error ? parsed.error : parsed?.data !== undefined ? JSON.stringify(parsed.data, null, 2) : record.content ?? '',
          success: parsed?.success,
        },
      }
      items.push(fallback)
      toolItemsById.set(fallback.toolCall.id, fallback)
      continue
    }
    // assistant
    items.push({ id: `hist-${index}`, kind: 'assistant', content: record.content ?? '' })
    for (const tc of extractToolCalls(record)) {
      const toolItem: ChatToolItem = { id: `hist-${index}-tool-${tc.id}`, kind: 'tool', toolCall: tc }
      items.push(toolItem)
      toolItemsById.set(tc.id, toolItem)
    }
  }
  return items
}

/** 过滤 <think> 标签 */
function parseThinkContent(text: string): { think: string | null; content: string } {
  const match = text.match(/<think>([\s\S]*?)<\/think>/)
  const think = match ? match[1]!.trim() : null
  const content = text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim()
  return { think, content }
}

/* ─── 子组件 ─── */

/** Markdown 渲染（含 think 折叠 + streaming 指示器） */
function MarkdownMessage({ text, streaming }: { text: string; streaming?: boolean }) {
  const { think, content } = useMemo(() => parseThinkContent(text), [text])

  return (
    <div className="space-y-2">
      {streaming && !content && (
        <div className="flex items-center gap-2 text-[12px] text-text-secondary">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span>处理中...</span>
        </div>
      )}
      {think && (
        <details className="group">
          <summary className="text-[10px] text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
            {streaming ? '思考中...' : '思考过程'}
          </summary>
          <div className="mt-1 px-3 py-2 bg-surface rounded-lg border border-border/30 text-[11px] text-text-muted leading-relaxed whitespace-pre-wrap">
            {think}
          </div>
        </details>
      )}
      <div className="prose-sm max-w-none text-text [&_p]:my-1 [&_p]:text-[13px] [&_p]:leading-relaxed [&_p]:text-text [&_ul]:my-1 [&_ol]:my-1 [&_li]:text-[13px] [&_li]:text-text [&_strong]:text-text [&_strong]:font-semibold [&_h1]:text-base [&_h1]:text-text [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:text-text [&_h3]:text-[13px] [&_h3]:text-text [&_code]:text-[11px] [&_code]:bg-surface [&_code]:text-primary-dark [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-[#2a2520] [&_pre]:text-[#e5e4e1] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-[11px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#e5e4e1] [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary [&_a]:text-primary [&_a]:underline [&_table]:text-[12px] [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_th]:bg-surface [&_th]:border-b [&_th]:border-border [&_hr]:border-border">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

/** 折叠式 tool call 卡片（复刻 devtools ToolCallCard） */
function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const [open, setOpen] = useState(false)
  const hasResult = toolCall.result !== undefined

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface/50 transition-colors"
      >
        {open ? <ChevronDown size={12} className="text-text-muted shrink-0" /> : <ChevronRight size={12} className="text-text-muted shrink-0" />}
        <Terminal size={12} className="text-primary shrink-0" />
        <span className="text-[11px] font-semibold text-primary-dark">{toolCall.name}</span>
        {hasResult && (
          toolCall.success
            ? <CheckCircle2 size={11} className="text-success shrink-0" />
            : <XCircle size={11} className="text-error shrink-0" />
        )}
        {!hasResult && <Loader2 size={11} className="text-text-muted animate-spin shrink-0" />}
        {toolCall.duration !== undefined && (
          <span className="flex items-center gap-0.5 text-[10px] text-text-muted ml-auto">
            <Clock size={9} />
            {toolCall.duration}ms
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-border/30 px-3 py-2 space-y-2">
          <div>
            <p className="text-[9px] font-semibold text-text-muted tracking-wide mb-1">ARGUMENTS</p>
            <pre className="text-[10px] font-mono bg-surface rounded p-2 text-text-secondary overflow-x-auto max-h-32 overflow-y-auto">{toolCall.args}</pre>
          </div>
          {toolCall.result !== undefined && (
            <div>
              <p className="text-[9px] font-semibold text-text-muted tracking-wide mb-1">RESULT</p>
              <pre className={`text-[10px] font-mono bg-surface rounded p-2 overflow-x-auto max-h-32 overflow-y-auto ${toolCall.success ? 'text-text-secondary' : 'text-error'}`}>{toolCall.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── ChatPanel 主组件 ─── */

interface ChatPanelProps {
  spaceId: string
  sessionId: string | null
  sessionLabel: string
  /** turn 完成后回调（通知父组件刷新 topology） */
  onTurnComplete?: () => void
}

/** 对话面板（复刻 devtools Conversation 的对话区） */
export function ChatPanel({ spaceId, sessionId, sessionLabel, onTurnComplete }: ChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [fetching, setFetching] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(100)

  /** 切换 session 时从后端拉历史 */
  const loadHistory = useCallback(async () => {
    if (!sessionId) { setItems([]); return }
    setFetching(true)
    try {
      const { records } = await fetchRecords(spaceId, sessionId)
      setItems(records.length > 0 ? buildHistoryItems(records) : [])
    } catch {
      setItems([])
    } finally {
      setFetching(false)
    }
  }, [spaceId, sessionId])

  useEffect(() => { loadHistory() }, [loadHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items])

  /** 发送消息（完全对齐 devtools Conversation.tsx handleSend） */
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || !sessionId || sending) return

    const userMsg: ChatTextItem = { id: String(nextIdRef.current++), kind: 'user', content: text }
    setItems((prev) => [...prev, userMsg])
    setInputValue('')
    setSending(true)

    const botId = String(nextIdRef.current++)
    setItems((prev) => [...prev, { id: botId, kind: 'assistant', content: '', streaming: true }])

    try {
      // 对齐 devtools：先 enterSession 再 turn
      await enterSession(spaceId, sessionId).catch(() => {})
      const result = await sendTurn(spaceId, sessionId, text)

      // 对齐 devtools 的 response 解析方式
      const turn = result?.turn
      const content = turn?.finalContent ?? turn?.rawResponse ?? JSON.stringify(result)
      const turnStats: TurnStats | undefined = turn ? {
        toolRoundCount: turn.toolRoundCount ?? 0,
        toolCallsExecuted: turn.toolCallsExecuted ?? 0,
      } : undefined

      const toolItems: ChatToolItem[] = (turn?.toolCalls ?? []).map((toolCall) => ({
        id: `${botId}-${toolCall.id}`,
        kind: 'tool' as const,
        toolCall: {
          id: toolCall.id,
          name: toolCall.name,
          args: JSON.stringify(toolCall.args, null, 2),
          success: toolCall.success,
          result: toolCall.error
            ? toolCall.error
            : toolCall.data !== undefined
              ? JSON.stringify(toolCall.data, null, 2)
              : undefined,
          duration: toolCall.duration,
        },
      }))

      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === botId && item.kind === 'assistant'
            ? { ...item, content, streaming: false, turnStats }
            : item,
        )
        const idx = next.findIndex((item) => item.id === botId)
        if (idx === -1 || toolItems.length === 0) return next
        next.splice(idx, 0, ...toolItems)
        return next
      })

      // 对齐 devtools：turn 完成后刷新 session 树和 detail
      setTimeout(() => {
        onTurnComplete?.()
      }, 500)
    } catch (err) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === botId && item.kind === 'assistant'
            ? { ...item, content: `⚠ Error: ${err instanceof Error ? err.message : 'Failed to send'}`, streaming: false }
            : item,
        ),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between h-13 px-5 border-b border-border shrink-0">
        <span className="text-[15px] font-semibold text-text">{sessionLabel || '选择节点'}</span>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto bg-surface px-6 py-5 space-y-4">
        {fetching && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        )}
        {!fetching && items.length === 0 && sessionId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">输入消息开始对话</p>
          </div>
        )}
        {!fetching && !sessionId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">选择一个节点开始对话</p>
          </div>
        )}
        {items.map((item) => (
          <div key={item.id}>
            {item.kind === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-primary text-white rounded-xl rounded-br-sm px-3.5 py-2.5 max-w-md transition-shadow hover:shadow-lg">
                  <p className="text-[13px] leading-relaxed">{item.content}</p>
                </div>
              </div>
            ) : item.kind === 'tool' ? (
              <div className="max-w-lg">
                <ToolCallCard toolCall={item.toolCall} />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-card rounded-xl rounded-bl-sm px-3.5 py-2.5 max-w-lg shadow-sm border border-border/30 transition-shadow hover:shadow-md">
                  <MarkdownMessage text={item.content} streaming={item.streaming} />
                </div>
                {item.turnStats && (item.turnStats.toolRoundCount > 0 || item.turnStats.toolCallsExecuted > 0) && (
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span>{item.turnStats.toolRoundCount} tool rounds</span>
                    <span>{item.turnStats.toolCallsExecuted} tool calls</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框（复刻 devtools 样式） */}
      <div className="flex items-center gap-2.5 h-14 px-5 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2 flex-1 h-9 px-3 bg-surface rounded-[10px] border border-border transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
          <Terminal size={14} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() } }}
            placeholder={sessionId ? '输入消息...' : '请先选择节点'}
            disabled={!sessionId}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-text-muted disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || !sessionId || sending}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            inputValue.trim() && sessionId && !sending
              ? 'bg-primary hover:bg-primary/90 scale-100 shadow-md'
              : 'bg-primary/40 scale-95'
          }`}
        >
          {sending ? <Loader2 size={16} className="text-white animate-spin" /> : <ArrowUp size={16} className="text-white" />}
        </button>
      </div>
    </div>
  )
}
