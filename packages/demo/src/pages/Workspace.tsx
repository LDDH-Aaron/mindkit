import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ChatPanel } from '../components/ChatPanel'
import { TopoCanvas } from '../components/TopoCanvas'
import { ScribbleBall } from '../components/ScribbleBall'
import { sendTurn, getSessionTree, getSessionMessages, type SessionTreeNode, type TurnRecord } from '../lib/api'

type Phase = 'idle' | 'animating' | 'active'

export function Workspace() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isNew = searchParams.has('new')
  const [phase, setPhase] = useState<Phase>(isNew ? 'idle' : 'active')
  const [tree, setTree] = useState<SessionTreeNode[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // 每个节点独立的消息列表
  const messagesMap = useRef<Map<string, TurnRecord[]>>(new Map())
  const [currentMessages, setCurrentMessages] = useState<TurnRecord[]>([])

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

  // 切换节点时加载该节点的 L3 消息
  useEffect(() => {
    if (!spaceId || !activeSessionId) return
    // 如果已有本地消息，直接用
    if (messagesMap.current.has(activeSessionId)) {
      setCurrentMessages([...messagesMap.current.get(activeSessionId)!])
      return
    }
    // 否则从 API 加载
    getSessionMessages(spaceId, activeSessionId).then(({ records }) => {
      messagesMap.current.set(activeSessionId, records)
      setCurrentMessages(records)
    }).catch(() => {
      messagesMap.current.set(activeSessionId, [])
      setCurrentMessages([])
    })
  }, [spaceId, activeSessionId])

  // 切换活跃节点
  const handleNodeClick = (id: string) => {
    if (id === activeSessionId) return
    setActiveSessionId(id)
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

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: 'var(--color-paper)' }}>
      {/* 返回按钮 */}
      {phase === 'active' && (
        <button
          onClick={() => navigate('/home')}
          className="fixed top-4 left-4 z-50 p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"
          style={{ color: 'var(--color-pencil)' }}
        >
          <ArrowLeft size={24} strokeWidth={1.5} />
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
          <div className="absolute top-0 left-0 bottom-0 z-40" style={{ width: 380, animation: 'panelSlideIn 0.6s ease-out forwards' }}>
            <ChatPanel messages={currentMessages} onSend={handleSend} sending={sending} nodeLabel={activeLabel} />
          </div>
          <div className="fixed z-50 pointer-events-none" style={{ animation: 'ballToTopo 0.7s ease-in-out forwards' }}>
            <ScribbleBall size={80} color="#3a6bc5" />
          </div>
        </>
      )}

      {/* 激活态 */}
      {phase === 'active' && (
        <div className="flex h-screen">
          <div className="shrink-0" style={{ width: 380 }}>
            <ChatPanel
              messages={currentMessages}
              onSend={handleSend}
              sending={sending}
              nodeLabel={activeLabel}
            />
          </div>
          <div className="flex-1 relative">
            <TopoCanvas
              spaceId={spaceId!}
              tree={tree}
              activeNodeId={activeSessionId}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}
