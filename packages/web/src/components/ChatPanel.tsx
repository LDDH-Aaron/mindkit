import { useState, useRef, useEffect } from 'react'
import type { TurnRecord } from '../lib/api'

interface ChatPanelProps {
  messages: TurnRecord[]
  onSend: (input: string) => void
  sending: boolean
  nodeLabel?: string
}

export function ChatPanel({ messages, onSend, sending, nodeLabel }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || sending) return
    onSend(text)
    setInput('')
  }

  return (
    <div
      className="flex flex-col h-full relative"
      style={{
        background: `repeating-linear-gradient(transparent, transparent 31px, var(--color-grid-line) 31px, var(--color-grid-line) 32px)`,
        backgroundPosition: '0 8px',
      }}
    >
      {/* 左侧红色边距线 */}
      <div
        className="absolute top-0 bottom-0 z-[2]"
        style={{ left: 52, width: 1, background: 'var(--color-margin-line)' }}
      />

      {/* 装订孔 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[2px] z-[5]"
        style={{
          background: `repeating-linear-gradient(transparent, transparent 28px, rgba(42,42,42,0.08) 28px, rgba(42,42,42,0.08) 30px, transparent 30px, transparent 36px)`,
        }}
      />

      {/* 标题 */}
      <div className="pt-12 pb-2 relative z-[3]" style={{ paddingLeft: 62, paddingRight: 20 }}>
        <h2
          className="text-[28px] font-bold"
          style={{
            fontFamily: 'var(--font-hand)',
            color: 'var(--color-blue-pen)',
            transform: 'rotate(-1.5deg)',
          }}
        >
          {nodeLabel || 'Chat Notes'}
        </h2>
      </div>

      {/* 消息列表 */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto flex flex-col gap-1 relative z-[3]"
        style={{ padding: '8px 20px 8px 62px' }}
      >
        {messages.length === 0 && (
          <p
            className="text-center mt-20"
            style={{
              fontFamily: 'var(--font-hand-alt)',
              fontSize: 18,
              color: 'var(--color-pencil)',
            }}
          >
            scribble something to start...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="relative" style={{ padding: '3px 0', lineHeight: '28px' }}>
            {/* 消息标记点 */}
            <span
              className="absolute"
              style={{
                left: -34,
                top: 10,
                width: msg.role === 'user' ? 8 : 7,
                height: msg.role === 'user' ? 8 : 7,
                borderRadius: msg.role === 'user' ? '50%' : 1,
                background: msg.role === 'user' ? 'var(--color-blue-pen)' : 'var(--color-red-pen)',
                transform: msg.role === 'assistant' ? 'rotate(45deg)' : undefined,
              }}
            />
            <span
              style={{
                fontFamily: msg.role === 'user' ? 'var(--font-hand)' : 'var(--font-hand-alt)',
                fontSize: msg.role === 'user' ? 19 : 17,
                color: msg.role === 'user' ? 'var(--color-blue-pen)' : 'var(--color-ink)',
                lineHeight: '28px',
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
        {sending && (
          <div className="relative" style={{ padding: '3px 0' }}>
            <span
              className="absolute"
              style={{
                left: -34, top: 10, width: 7, height: 7,
                borderRadius: 1, background: 'var(--color-red-pen)',
                transform: 'rotate(45deg)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-hand-alt)',
                fontSize: 17,
                color: 'var(--color-pencil)',
              }}
            >
              thinking...
            </span>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div
        className="flex items-center gap-3 relative z-[3]"
        style={{ padding: '12px 20px 16px 62px' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="scribble something..."
          className="flex-1 border-none outline-none bg-transparent"
          style={{
            borderBottom: '1.5px solid var(--color-pencil)',
            padding: '6px 2px',
            fontFamily: 'var(--font-hand)',
            fontSize: 20,
            color: 'var(--color-blue-pen)',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="w-10 h-10 border-2 bg-transparent text-lg cursor-pointer transition-transform hover:scale-110 hover:rotate-5 active:scale-95 disabled:opacity-40"
          style={{
            borderColor: 'var(--color-ink)',
            borderRadius: '45% 55% 50% 50% / 50% 45% 55% 50%',
            color: 'var(--color-ink)',
          }}
        >
          ✒
        </button>
      </div>
    </div>
  )
}
