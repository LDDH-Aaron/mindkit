import { useState, useEffect } from 'react'
import { getEvents, type SpaceEvent } from '../lib/api'

interface EventStreamProps {
  spaceId: string
  onNodeClick?: (nodeId: string) => void
}

const EVENT_ICONS: Record<SpaceEvent['type'], { icon: string; color: string }> = {
  node_created: { icon: '🌱', color: '#5ba85b' },
  node_activated: { icon: '⚡', color: '#c78a30' },
  l2_updated: { icon: '📝', color: '#3a6bc5' },
  insight_generated: { icon: '💡', color: '#7E57C2' },
  product_created: { icon: '📄', color: '#3a6bc5' },
  product_updated: { icon: '🔄', color: '#c78a30' },
  cross_node_link: { icon: '🔗', color: '#c94a4a' },
}

const EVENT_TYPE_LABELS: Record<SpaceEvent['type'], string> = {
  node_created: '节点创建',
  node_activated: '节点激活',
  l2_updated: '摘要更新',
  insight_generated: '全局洞察',
  product_created: '产物生成',
  product_updated: '产物更新',
  cross_node_link: '跨节点关联',
}

export function EventStream({ spaceId, onNodeClick }: EventStreamProps) {
  const [events, setEvents] = useState<SpaceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SpaceEvent['type'] | 'all'>('all')

  useEffect(() => {
    setLoading(true)
    getEvents(spaceId)
      .then(({ events }) => setEvents(events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [spaceId])

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handAlt = { fontFamily: 'var(--font-hand-alt)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  const filterTypes: (SpaceEvent['type'] | 'all')[] = ['all', 'node_created', 'insight_generated', 'product_created', 'product_updated', 'l2_updated', 'cross_node_link']

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-paper)' }}>
      {/* 标题 */}
      <div className="px-6 pt-6 pb-3">
        <h2
          className="text-[28px] font-bold"
          style={{ ...handFont, color: 'var(--color-ink)', transform: 'rotate(-1deg)', display: 'inline-block' }}
        >
          事件流
        </h2>
        <p style={{ ...handAlt, fontSize: 15, color: 'var(--color-pencil)', marginTop: 4 }}>
          AI 的记忆流转和全局管理过程
        </p>
      </div>

      {/* 筛选 */}
      <div className="px-6 pb-3 flex flex-wrap gap-2">
        {filterTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-1 rounded-full cursor-pointer border transition-colors"
            style={{
              ...handSm,
              fontSize: 14,
              borderColor: filter === t ? 'var(--color-blue-pen)' : 'rgba(42,42,42,0.1)',
              background: filter === t ? 'rgba(58,107,197,0.08)' : 'transparent',
              color: filter === t ? 'var(--color-blue-pen)' : 'var(--color-pencil)',
            }}
          >
            {t === 'all' ? '全部' : EVENT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 时间线 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading && <p style={{ ...handAlt, fontSize: 16, color: 'var(--color-pencil)' }}>加载中...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-center py-12" style={{ ...handFont, fontSize: 18, color: 'var(--color-pencil)' }}>
            暂无事件记录
          </p>
        )}
        <div className="relative">
          {/* 竖线 */}
          {filtered.length > 0 && (
            <div
              className="absolute top-2 bottom-2"
              style={{ left: 15, width: 2, background: 'rgba(42,42,42,0.06)', borderRadius: 1 }}
            />
          )}
          <div className="flex flex-col gap-1">
            {filtered.map((evt) => {
              const meta = EVENT_ICONS[evt.type]
              return (
                <div key={evt.id} className="flex items-start gap-4 relative py-2">
                  {/* 节点圆点 */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10 text-sm"
                    style={{ background: 'var(--color-paper)', border: `2px solid ${meta.color}20` }}
                  >
                    {meta.icon}
                  </div>
                  {/* 内容 */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          ...handSm,
                          fontSize: 13,
                          background: `${meta.color}15`,
                          color: meta.color,
                          border: `1px solid ${meta.color}25`,
                        }}
                      >
                        {EVENT_TYPE_LABELS[evt.type]}
                      </span>
                      <span style={{ ...handSm, fontSize: 14, color: 'var(--color-pencil)' }}>
                        {new Date(evt.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ ...handAlt, fontSize: 17, color: 'var(--color-ink)', lineHeight: 1.5 }}>
                      {evt.description}
                    </p>
                    {/* 可点击跳转 */}
                    {evt.nodeId && onNodeClick && (
                      <button
                        onClick={() => onNodeClick(evt.nodeId!)}
                        className="mt-1 bg-transparent border-none cursor-pointer underline"
                        style={{ ...handSm, fontSize: 14, color: 'var(--color-blue-pen)' }}
                      >
                        跳转到节点 →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
