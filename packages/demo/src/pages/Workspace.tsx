import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, PanelLeftClose, Settings } from 'lucide-react'
import { ChatPanel } from '../components/ChatPanel'
import { TopoCanvas } from '../components/TopoCanvas'
import { ScribbleBall } from '../components/ScribbleBall'
import { ProductView } from '../components/ProductView'
import { EventStream } from '../components/EventStream'
import { SettingsPanel } from '../components/SettingsPanel'
import {
  sendTurn, getSessionTree, getSessionMessages, getSessionL2, getInsights, listSpaces,
  type SessionTreeNode, type TurnRecord, type Insight, type Space
} from '../lib/api'

type Phase = 'idle' | 'animating' | 'active'
type ViewTab = 'nodes' | 'products' | 'events'
type PanelTab = 'chat' | 'insight'

export function Workspace() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isNew = searchParams.has('new')
  const [phase, setPhase] = useState<Phase>(isNew ? 'idle' : 'active')
  const [tree, setTree] = useState<SessionTreeNode[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [viewTab, setViewTab] = useState<ViewTab>('nodes')
  const [panelTab, setPanelTab] = useState<PanelTab>('chat')
  const [showSettings, setShowSettings] = useState(false)
  const [space, setSpace] = useState<Space | null>(null)

  // L2 + insights
  const [currentL2, setCurrentL2] = useState<string | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])

  // 每个节点独立的消息列表
  const messagesMap = useRef<Map<string, TurnRecord[]>>(new Map())
  const [currentMessages, setCurrentMessages] = useState<TurnRecord[]>([])

  // 加载 space 信息
  useEffect(() => {
    if (!spaceId) return
    listSpaces().then(({ spaces }) => {
      const found = spaces.find(s => s.id === spaceId)
      if (found) setSpace(found)
    }).catch(() => {})
  }, [spaceId])

  // 从 tree 中找节点 label
  const findLabel = useCallback((id: string, nodes: SessionTreeNode[]): string => {
    for (const n of nodes) {
      if (n.id === id) return n.label
      const found = findLabel(id, n.children)
      if (found) return found
    }
    return ''
  }, [])

  const activeLabel = activeSessionId ? findLabel(activeSessionId, tree) : ''

  // 加载 session 树
  const refreshTree = useCallback(async () => {
    if (!spaceId) return
    try {
      const data = await getSessionTree(spaceId)
      setTree(data.tree || [])
      if (!activeSessionId && data.tree?.length > 0) {
        setActiveSessionId(data.tree[0].id)
      }
    } catch { /* 首次可能为空 */ }
  }, [spaceId, activeSessionId])

  useEffect(() => { refreshTree() }, [refreshTree])

  // 加载全局洞察
  useEffect(() => {
    if (!spaceId) return
    getInsights(spaceId).then(({ insights }) => setInsights(insights)).catch(() => {})
  }, [spaceId])

  // 切换节点时加载该节点的 L3 消息和 L2 摘要
  useEffect(() => {
    if (!spaceId || !activeSessionId) return
    // L3 消息
    if (messagesMap.current.has(activeSessionId)) {
      setCurrentMessages([...messagesMap.current.get(activeSessionId)!])
    } else {
      getSessionMessages(spaceId, activeSessionId).then(({ records }) => {
        messagesMap.current.set(activeSessionId, records)
        setCurrentMessages(records)
      }).catch(() => {
        messagesMap.current.set(activeSessionId, [])
        setCurrentMessages([])
      })
    }
    // L2 摘要
    getSessionL2(spaceId, activeSessionId).then(({ content }) => setCurrentL2(content)).catch(() => setCurrentL2(null))
  }, [spaceId, activeSessionId])

  // 切换活跃节点
  const handleNodeClick = (id: string) => {
    if (id === activeSessionId) return
    setActiveSessionId(id)
    if (!drawerOpen) setDrawerOpen(true)
    if (viewTab !== 'nodes') setViewTab('nodes')
  }

  // 纸团点击
  const handleBallClick = () => {
    if (phase !== 'idle') return
    setPhase('animating')
    setTimeout(() => {
      setPhase('active')
      setSearchParams({}, { replace: true })
    }, 700)
  }

  // 发送消息到当前活跃节点
  const handleSend = async (input: string) => {
    if (!spaceId || !activeSessionId || sending) return
    setSending(true)

    const userMsg: TurnRecord = { role: 'user', content: input, timestamp: new Date().toISOString() }
    const current = messagesMap.current.get(activeSessionId) || []
    current.push(userMsg)
    messagesMap.current.set(activeSessionId, current)
    setCurrentMessages([...current])

    try {
      const result = await sendTurn(spaceId, activeSessionId, input)
      const aiMsg: TurnRecord = { role: 'assistant', content: result.response, timestamp: new Date().toISOString() }
      current.push(aiMsg)
      messagesMap.current.set(activeSessionId, current)
      setCurrentMessages([...current])
      refreshTree()
    } catch {
      const errMsg: TurnRecord = { role: 'assistant', content: '(连接失败，请重试)', timestamp: new Date().toISOString() }
      current.push(errMsg)
      messagesMap.current.set(activeSessionId, current)
      setCurrentMessages([...current])
    } finally {
      setSending(false)
    }
  }

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  const viewTabs: { key: ViewTab; label: string }[] = [
    { key: 'nodes', label: '节点视图' },
    { key: 'products', label: '产物视图' },
    { key: 'events', label: '事件流' },
  ]

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: 'var(--color-paper)' }}>

      {/* ─── 顶栏 ─── */}
      {phase === 'active' && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-4 pl-4 pr-6 h-12"
          style={{ background: 'var(--color-paper)', borderBottom: '1px solid rgba(42,42,42,0.06)' }}
        >
          {/* 返回 */}
          <button
            onClick={() => navigate('/home')}
            className="p-1.5 rounded-full hover:scale-110 transition-transform cursor-pointer bg-transparent border-none"
            style={{ color: 'var(--color-pencil)' }}
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>

          {/* Kit 名称 */}
          <div className="flex items-center gap-2">
            {space && <span className="text-[18px]">{space.emoji}</span>}
            <span className="text-[20px] font-semibold" style={{ ...handFont, color: 'var(--color-ink)' }}>
              {space?.label || 'Kit'}
            </span>
            {space && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  ...handSm, fontSize: 11,
                  background: space.mode === 'AUTO' ? 'rgba(58,107,197,0.1)' : 'rgba(201,74,74,0.1)',
                  color: space.mode === 'AUTO' ? 'var(--color-blue-pen)' : 'var(--color-red-pen)',
                }}
              >
                {space.mode}
              </span>
            )}
          </div>

          {/* 当前节点 + 对话/沉淀 tab */}
          {drawerOpen && activeLabel && (
            <div className="flex items-center gap-3" style={{ borderLeft: '1px solid rgba(42,42,42,0.1)', paddingLeft: 16 }}>
              <span className="text-[16px] font-semibold" style={{ ...handFont, color: 'var(--color-blue-pen)' }}>
                {activeLabel}
              </span>
              {[
                { key: 'chat' as PanelTab, label: '对话' },
                { key: 'insight' as PanelTab, label: '沉淀' }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPanelTab(t.key)}
                  className="px-2 py-0.5 rounded-md bg-transparent border-none cursor-pointer transition-colors"
                  style={{
                    ...handSm, fontSize: 13,
                    color: panelTab === t.key ? 'var(--color-blue-pen)' : 'var(--color-pencil)',
                    background: panelTab === t.key ? 'rgba(58,107,197,0.08)' : 'transparent',
                    fontWeight: panelTab === t.key ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* spacer 把后面的内容推到右边 */}
          <div className="flex-1" />

          {/* 视图切换 + 设置（右侧贴边） */}
          <div className="flex items-center gap-2">
            {viewTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setViewTab(t.key)}
                className="px-3 py-1 rounded-md bg-transparent border-none cursor-pointer transition-colors"
                style={{
                  ...handSm, fontSize: 14,
                  color: viewTab === t.key ? 'var(--color-blue-pen)' : 'var(--color-pencil)',
                  background: viewTab === t.key ? 'rgba(58,107,197,0.08)' : 'transparent',
                  fontWeight: viewTab === t.key ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-full hover:scale-110 transition-transform cursor-pointer bg-transparent border-none ml-1"
              style={{ color: 'var(--color-pencil)' }}
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* 侧边展开按钮（抽屉关闭时显示） */}
      {phase === 'active' && !drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed z-50 cursor-pointer flex items-center justify-center hover:scale-105 transition-transform"
          style={{
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28,
            height: 72,
            background: 'var(--color-paper)',
            border: '1.5px solid rgba(42,42,42,0.12)',
            borderLeft: 'none',
            borderRadius: '0 10px 10px 0',
            color: 'var(--color-pencil)',
            boxShadow: '2px 0 6px rgba(0,0,0,0.04)',
          }}
          title="打开对话"
        >
          <MessageSquare size={16} strokeWidth={1.5} />
        </button>
      )}

      {/* 初始态 */}
      {phase === 'idle' && (
        <button
          onClick={handleBallClick}
          className="fixed z-50 cursor-pointer bg-transparent border-none"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', transition: 'transform 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
        >
          <ScribbleBall size={80} color="#3a6bc5" />
          <p className="mt-2 text-center" style={{ fontFamily: 'var(--font-hand-sm)', fontSize: 14, color: 'var(--color-pencil)' }}>
            tap to start
          </p>
        </button>
      )}

      {/* 动画态 */}
      {phase === 'animating' && (
        <>
          <div className="absolute top-0 left-0 bottom-0 z-40" style={{ width: '40%', animation: 'panelSlideIn 0.6s ease-out forwards' }}>
            <ChatPanel messages={currentMessages} onSend={handleSend} sending={sending} nodeLabel={activeLabel} />
          </div>
          <div className="fixed z-50 pointer-events-none" style={{ animation: 'ballToTopo 0.7s ease-in-out forwards' }}>
            <ScribbleBall size={80} color="#3a6bc5" />
          </div>
        </>
      )}

      {/* 激活态 */}
      {phase === 'active' && (
        <div className="flex h-screen" style={{ paddingTop: 48 }}>
          {/* 左侧对话抽屉 */}
          <div
            className="shrink-0 h-full relative overflow-hidden"
            style={{
              width: drawerOpen ? '40%' : 0,
              transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="h-full" style={{ width: '40vw', minWidth: '40vw' }}>
              <ChatPanel
                messages={currentMessages}
                onSend={handleSend}
                sending={sending}
                nodeLabel={activeLabel}
                activeTab={panelTab}
                l2Summary={currentL2}
                insights={insights}
                onInsightNodeClick={handleNodeClick}
              />
            </div>
            {/* 收起按钮 */}
            {drawerOpen && (
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:scale-110 transition-transform cursor-pointer bg-transparent border-none"
                style={{ color: 'var(--color-pencil)' }}
                title="收起对话"
              >
                <PanelLeftClose size={20} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* 右侧面板 */}
          <div className="flex-1 relative h-full">
            {viewTab === 'nodes' && (
              <TopoCanvas
                spaceId={spaceId!}
                tree={tree}
                activeNodeId={activeSessionId}
                onNodeClick={handleNodeClick}
              />
            )}
            {viewTab === 'products' && (
              <ProductView spaceId={spaceId!} />
            )}
            {viewTab === 'events' && (
              <EventStream spaceId={spaceId!} onNodeClick={handleNodeClick} />
            )}
          </div>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && space && (
        <SettingsPanel
          space={space}
          onClose={() => setShowSettings(false)}
          onUpdate={(updated) => setSpace(updated)}
        />
      )}
    </div>
  )
}
