import { useState, useRef, useEffect } from 'react'
import type { TurnRecord, Insight } from '../lib/api'

export type PanelTab = 'chat' | 'insight'

interface ChatPanelProps {
  messages: TurnRecord[]
  onSend: (input: string) => void
  sending: boolean
  /** 受控的当前 tab */
  activeTab?: PanelTab
  /** L2 摘要 */
  l2Summary?: string | null
  /** 全局洞察列表 */
  insights?: Insight[]
  /** 点击洞察中的节点 */
  onInsightNodeClick?: (nodeId: string) => void
  /** 受控输入值（自动演示用） */
  controlledInput?: string
  /** 受控输入变更（自动演示用） */
  onControlledInputChange?: (v: string) => void
}

export function ChatPanel({
  messages,
  onSend,
  sending,
  activeTab = 'chat',
  l2Summary,
  insights = [],
  onInsightNodeClick,
  controlledInput,
  onControlledInputChange
}: ChatPanelProps) {
  const [localInput, setLocalInput] = useState('')
  const isControlled = controlledInput !== undefined
  const input = isControlled ? controlledInput : localInput
  const setInput = isControlled ? (v: string) => onControlledInputChange?.(v) : setLocalInput
  const messagesRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, activeTab])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || sending) return
    onSend(text)
    setInput('')
  }

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handAlt = { fontFamily: 'var(--font-hand-alt)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  return (
    <div
      className="flex flex-col h-full relative"
      style={{
        background: `repeating-linear-gradient(transparent, transparent 31px, var(--color-grid-line) 31px, var(--color-grid-line) 32px)`,
        backgroundPosition: '0 8px'
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
          background: `repeating-linear-gradient(transparent, transparent 28px, rgba(42,42,42,0.08) 28px, rgba(42,42,42,0.08) 30px, transparent 30px, transparent 36px)`
        }}
      />

      {/* 顶部留白（标题和 tab 已移到顶栏） */}
      <div className="pt-4 relative z-[3]" />

      {/* ─── 对话 Tab ─── */}
      {activeTab === 'chat' && (
        <>
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto flex flex-col gap-3 relative z-[3]"
            style={{ padding: '8px 20px 8px 62px' }}
          >
            {messages.length === 0 && (
              <p
                className="text-center mt-20"
                style={{
                  ...handAlt,
                  fontSize: 18,
                  color: 'var(--color-pencil)'
                }}
              >
                scribble something to start...
              </p>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              // AI 回复根据内容变色
              const hasConflict = !isUser && /矛盾|⚠️/.test(msg.content)
              const hasRelate = !isUser && /关联/.test(msg.content)
              const hasFork = !isUser && /分裂/.test(msg.content)
              let aiBg = 'rgba(42,42,42,0.06)'
              let aiBorder = '1.5px solid rgba(42,42,42,0.08)'
              let aiColor = 'var(--color-ink)'
              let aiTag = ''
              if (hasConflict) {
                aiBg = 'rgba(201,74,74,0.08)'
                aiBorder = '1.5px solid rgba(201,74,74,0.18)'
                aiColor = 'var(--color-red-pen)'
                aiTag = '⚡ 矛盾'
              } else if (hasRelate) {
                aiBg = 'rgba(58,107,197,0.08)'
                aiBorder = '1.5px solid rgba(58,107,197,0.18)'
                aiColor = 'var(--color-blue-pen)'
                aiTag = '🔗 关联'
              } else if (hasFork) {
                aiBg = 'rgba(91,168,91,0.08)'
                aiBorder = '1.5px solid rgba(91,168,91,0.18)'
                aiColor = 'var(--color-green-hl)'
                aiTag = '🌿 分裂'
              }
              return (
                <div
                  key={i}
                  className="flex"
                  style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: isUser
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      background: isUser
                        ? 'rgba(58,107,197,0.12)'
                        : aiBg,
                      border: isUser
                        ? '1.5px solid rgba(58,107,197,0.18)'
                        : aiBorder,
                      fontFamily: isUser
                        ? 'var(--font-hand)'
                        : 'var(--font-hand-alt)',
                      fontSize: isUser ? 15 : 14,
                      color: isUser
                        ? 'var(--color-blue-pen)'
                        : aiColor,
                      lineHeight: 1.6
                    }}
                  >
                    {aiTag && (
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 11,
                          fontFamily: 'var(--font-hand-sm)',
                          marginBottom: 4,
                          padding: '1px 8px',
                          borderRadius: 8,
                          background: isUser ? undefined : `${aiColor}15`,
                          color: aiColor,
                          fontWeight: 600
                        }}
                      >
                        {aiTag}
                      </span>
                    )}
                    {aiTag && <br />}
                    {msg.content}
                  </div>
                </div>
              )
            })}
            {sending && (
              <div className="flex" style={{ justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'rgba(42,42,42,0.06)',
                    border: '1.5px solid rgba(42,42,42,0.08)',
                    ...handAlt,
                    fontSize: 14,
                    color: 'var(--color-pencil)'
                  }}
                >
                  thinking...
                </div>
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
                ...handFont,
                fontSize: 16,
                color: 'var(--color-blue-pen)'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-10 h-10 border-2 bg-transparent text-lg cursor-pointer transition-transform hover:scale-110 hover:rotate-5 active:scale-95 disabled:opacity-40"
              style={{
                borderColor: 'var(--color-ink)',
                borderRadius: '45% 55% 50% 50% / 50% 45% 55% 50%',
                color: 'var(--color-ink)'
              }}
            >
              ✒
            </button>
          </div>
        </>
      )}

      {/* ─── 摘要·洞察 Tab ─── */}
      {activeTab === 'insight' && (
        <div
          className="flex-1 overflow-y-auto relative z-[3]"
          style={{ padding: '12px 20px 16px 62px' }}
        >
          {/* 当前节点 L2 摘要 */}
          <div className="mb-6">
            <h3
              className="text-[18px] font-semibold mb-2"
              style={{ ...handFont, color: 'var(--color-ink)' }}
            >
              当前节点摘要
            </h3>
            {l2Summary ? (
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(58,107,197,0.06)',
                  border: '1.5px solid rgba(58,107,197,0.12)',
                  ...handAlt,
                  fontSize: 15,
                  color: 'var(--color-ink)',
                  lineHeight: 1.6
                }}
              >
                {l2Summary}
              </div>
            ) : (
              <p
                style={{
                  ...handSm,
                  fontSize: 14,
                  color: 'var(--color-pencil)'
                }}
              >
                对话后会自动生成摘要
              </p>
            )}
          </div>

          {/* 全局洞察 */}
          <div>
            <h3
              className="text-[18px] font-semibold mb-2"
              style={{ ...handFont, color: 'var(--color-ink)' }}
            >
              全局洞察
            </h3>
            {insights.length === 0 ? (
              <p
                style={{
                  ...handSm,
                  fontSize: 14,
                  color: 'var(--color-pencil)'
                }}
              >
                AI 发现跨节点关联后会在这里展示
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(126,87,194,0.06)',
                      border: '1.5px solid rgba(126,87,194,0.12)'
                    }}
                  >
                    <p
                      style={{
                        ...handAlt,
                        fontSize: 15,
                        color: 'var(--color-ink)',
                        lineHeight: 1.5,
                        marginBottom: 6
                      }}
                    >
                      💡 {ins.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        style={{
                          ...handSm,
                          fontSize: 12,
                          color: 'var(--color-pencil)'
                        }}
                      >
                        来源：
                      </span>
                      {ins.sourceLabels.map((label, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            onInsightNodeClick?.(ins.sourceNodeIds[i])
                          }
                          className="px-2 py-0.5 rounded-full bg-transparent cursor-pointer transition-colors hover:bg-black/5"
                          style={{
                            ...handSm,
                            fontSize: 12,
                            color: 'var(--color-blue-pen)',
                            border: '1px solid rgba(58,107,197,0.2)'
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div
                      style={{
                        ...handSm,
                        fontSize: 11,
                        color: 'var(--color-pencil)',
                        marginTop: 4
                      }}
                    >
                      {new Date(ins.timestamp).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
