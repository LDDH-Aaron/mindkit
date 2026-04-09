import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  PanelLeftClose,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react'
import { ChatPanel } from '../components/ChatPanel'
import { TopoCanvas } from '../components/TopoCanvas'
import { ScribbleBall } from '../components/ScribbleBall'
import { ProductView } from '../components/ProductView'
import { EventStream } from '../components/EventStream'
import { SettingsPanel } from '../components/SettingsPanel'
import {
  sendTurn,
  getSessionTree,
  getSessionMessages,
  getSessionL2,
  getInsights,
  listSpaces,
  sp1AutoDemo,
  resetSp1Demo,
  consumeNodeConversation,
  sp1ProductTriggers,
  addSp1Product,
  type SessionTreeNode,
  type TurnRecord,
  type Insight,
  type Space
} from '../lib/api'

type Phase = 'idle' | 'animating' | 'active'
type ViewTab = 'nodes' | 'products' | 'events'
type PanelTab = 'chat' | 'insight'

export function Workspace() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isNew = searchParams.has('new')
  const isDemo = searchParams.has('demo')
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

  // 缩放（受控，由控制面板滑条管理）
  const [canvasZoom, setCanvasZoom] = useState(1)

  // 自动演示模式（仅 sp-1）
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [autoStepIndex, setAutoStepIndex] = useState(0)
  const [typingText, setTypingText] = useState('')
  const autoPlayingRef = useRef(false)
  const autoStepRef = useRef(0)
  const [demoControlOpen, setDemoControlOpen] = useState(false)
  const [demoMode, setDemoMode] = useState<'fast' | 'immersive'>('fast')
  const [playSpeed, setPlaySpeed] = useState(1) // 0.5x / 1x / 1.5x / 2x
  const playSpeedRef = useRef(1)
  playSpeedRef.current = playSpeed
  // 聚焦节点（沉浸模式用，驱动 TopoCanvas 平移动画）
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)

  // Skill 调用对话框
  const [skillDialog, setSkillDialog] = useState<{
    skillName: string
    skillDesc: string
    sourceNodes: string[]
    productTitle: string
    phase: 'collecting' | 'generating' | 'done'
  } | null>(null)

  // 加载 space 信息
  useEffect(() => {
    if (!spaceId) return
    listSpaces()
      .then(({ spaces }) => {
        const found = spaces.find((s) => s.id === spaceId)
        if (found) setSpace(found)
      })
      .catch(() => {})
  }, [spaceId])

  // 从 tree 中找节点 label
  const findLabel = useCallback(
    (id: string, nodes: SessionTreeNode[]): string => {
      for (const n of nodes) {
        if (n.id === id) return n.label
        const found = findLabel(id, n.children)
        if (found) return found
      }
      return ''
    },
    []
  )

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
    } catch {
      /* 首次可能为空 */
    }
  }, [spaceId, activeSessionId])

  useEffect(() => {
    refreshTree()
  }, [refreshTree])

  // 加载全局洞察
  useEffect(() => {
    if (!spaceId) return
    getInsights(spaceId)
      .then(({ insights }) => setInsights(insights))
      .catch(() => {})
  }, [spaceId])

  // 切换节点时加载该节点的 L3 消息和 L2 摘要
  useEffect(() => {
    if (!spaceId || !activeSessionId) return
    // 演示模式下，未开始前不加载消息（等 pendingDemoStart 完成后再加载）
    if (pendingDemoStart.current || (isDemo && phase !== 'active')) return
    // L3 消息
    if (messagesMap.current.has(activeSessionId)) {
      setCurrentMessages([...messagesMap.current.get(activeSessionId)!])
    } else {
      getSessionMessages(spaceId, activeSessionId)
        .then(({ records }) => {
          messagesMap.current.set(activeSessionId, records)
          setCurrentMessages(records)
        })
        .catch(() => {
          messagesMap.current.set(activeSessionId, [])
          setCurrentMessages([])
        })
    }
    // L2 摘要
    getSessionL2(spaceId, activeSessionId)
      .then(({ content }) => setCurrentL2(content))
      .catch(() => setCurrentL2(null))
  }, [spaceId, activeSessionId])

  // 切换活跃节点
  const handleNodeClick = (id: string) => {
    if (id === activeSessionId) return
    setActiveSessionId(id)
    if (!drawerOpen) setDrawerOpen(true)
    if (viewTab !== 'nodes') setViewTab('nodes')
  }

  // 纸团点击
  // 演示模式：纸团展开后是否需要自动开始沉浸式演示
  const pendingDemoStart = useRef(false)

  const handleBallClick = () => {
    if (phase !== 'idle') return
    if (isDemo && spaceId === 'sp-1') {
      pendingDemoStart.current = true
    }
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

    const userMsg: TurnRecord = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }
    const current = messagesMap.current.get(activeSessionId) || []
    current.push(userMsg)
    messagesMap.current.set(activeSessionId, current)
    setCurrentMessages([...current])

    try {
      const result = await sendTurn(spaceId, activeSessionId, input)
      const aiMsg: TurnRecord = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString()
      }
      current.push(aiMsg)
      // 系统通知作为独立消息（关联/矛盾发现等）
      if (result.systemNotices?.length) {
        for (const notice of result.systemNotices) {
          current.push({
            role: 'assistant',
            content: notice,
            timestamp: new Date().toISOString()
          })
        }
      }
      messagesMap.current.set(activeSessionId, current)
      setCurrentMessages([...current])
      refreshTree()
    } catch {
      const errMsg: TurnRecord = {
        role: 'assistant',
        content: '(连接失败，请重试)',
        timestamp: new Date().toISOString()
      }
      current.push(errMsg)
      messagesMap.current.set(activeSessionId, current)
      setCurrentMessages([...current])
    } finally {
      setSending(false)
    }
  }

  // 用 ref 持有最新的 handleSend 避免 stale closure
  const handleSendRef = useRef(handleSend)
  handleSendRef.current = handleSend

  // 用 ref 持有最新的 demoMode 避免 stale closure
  const demoModeRef = useRef(demoMode)
  demoModeRef.current = demoMode

  /** 速度调节延迟：ms 除以播放速度 */
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms / playSpeedRef.current))

  // 自动演示：两种模式
  const runAutoStep = useCallback(async () => {
    if (!spaceId || autoStepRef.current >= sp1AutoDemo.length) {
      setAutoPlaying(false)
      autoPlayingRef.current = false
      return
    }
    const step = sp1AutoDemo[autoStepRef.current]
    const isImmersive = demoModeRef.current === 'immersive'

    if (isImmersive) {
      // ─── 沉浸模式：完整模拟用户操作流程 ───

      // 1. 视角平移到目标节点
      setFocusNodeId(step.targetSessionId)
      await wait(800)
      if (!autoPlayingRef.current) return

      // 2. "点击"节点 → 切换活跃节点 + 打开抽屉
      setActiveSessionId(step.targetSessionId)
      setDrawerOpen(true)
      setPanelTab('chat')
      await wait(600)
      if (!autoPlayingRef.current) return

      // 3. 逐字打字 fork 触发消息
      const text = step.userInput
      for (let i = 0; i <= text.length; i++) {
        if (!autoPlayingRef.current) return
        setTypingText(text.slice(0, i))
        await wait(100)
      }
      await wait(500)
      if (!autoPlayingRef.current) return

      // 4. 发送 → 创建新节点
      setTypingText('')
      await handleSendRef.current(text)

      // 5. AI 回复后停顿
      await wait(2000)
      if (!autoPlayingRef.current) return

      // 6. 取出新节点的对话脚本（从空白逐轮回放）
      const newNodeId = step.createdNodeId
      const script = consumeNodeConversation(newNodeId)
      if (script.length > 0) {
        // 先把新节点的消息缓存清空
        messagesMap.current.set(newNodeId, [])

        // 视角平移到新节点
        setFocusNodeId(newNodeId)
        await wait(600)
        if (!autoPlayingRef.current) return

        // 切换到新节点
        setActiveSessionId(newNodeId)
        setCurrentMessages([])
        await wait(400)
        if (!autoPlayingRef.current) return

        // 逐轮回放对话
        const nodeMessages: TurnRecord[] = []
        for (const msg of script) {
          if (!autoPlayingRef.current) return

          if (msg.role === 'user') {
            // 逐字打字
            for (let i = 0; i <= msg.content.length; i++) {
              if (!autoPlayingRef.current) return
              setTypingText(msg.content.slice(0, i))
              await wait(60)
            }
            await wait(300)
            if (!autoPlayingRef.current) return

            // "发送"
            setTypingText('')
            nodeMessages.push(msg)
            messagesMap.current.set(newNodeId, [...nodeMessages])
            setCurrentMessages([...nodeMessages])

            // 等 AI 回复的停顿
            setSending(true)
            await wait(800 + Math.random() * 600)
            setSending(false)
          } else {
            // AI 回复直接出现
            nodeMessages.push(msg)
            messagesMap.current.set(newNodeId, [...nodeMessages])
            setCurrentMessages([...nodeMessages])

            // 阅读停顿
            await wait(1200 + Math.random() * 800)
          }
        }

        // 回放完毕，停顿让用户看到完整对话
        await wait(1000)
        if (!autoPlayingRef.current) return
      }

      // 7. 关闭抽屉，回到全局视角
      setDrawerOpen(false)
      setFocusNodeId(null)
      await wait(1000)
      if (!autoPlayingRef.current) return
    } else {
      // ─── 快速模式：不跟随、不开抽屉 ───

      // 1. 切换到目标节点
      setActiveSessionId(step.targetSessionId)
      await new Promise((r) => setTimeout(r, 400))
      if (!autoPlayingRef.current) return

      // 2. 逐字打字
      const text = step.userInput
      for (let i = 0; i <= text.length; i++) {
        if (!autoPlayingRef.current) return
        setTypingText(text.slice(0, i))
        await new Promise((r) => setTimeout(r, 80))
      }
      await new Promise((r) => setTimeout(r, 300))
      if (!autoPlayingRef.current) return

      // 3. 发送
      setTypingText('')
      await handleSendRef.current(text)

      // 4. 等待生长动画
      await new Promise((r) => setTimeout(r, 2000))
      if (!autoPlayingRef.current) return
    }

    // 产物生成触发
    const currentStep = autoStepRef.current
    const productTrigger = sp1ProductTriggers[currentStep]
    if (productTrigger && !autoPlayingRef.current) {
      // 被暂停了就跳过
    } else if (productTrigger) {
      // 显示 Skill 调用对话框
      setSkillDialog({
        skillName: productTrigger.skillName,
        skillDesc: productTrigger.skillDesc,
        sourceNodes: productTrigger.sourceNodes,
        productTitle: productTrigger.productTitle,
        phase: 'collecting',
      })
      await wait(2000)
      if (!autoPlayingRef.current) { setSkillDialog(null); return }

      // 切换到"生成中"阶段
      setSkillDialog((prev) => prev ? { ...prev, phase: 'generating' } : null)
      await wait(2500)
      if (!autoPlayingRef.current) { setSkillDialog(null); return }

      // 生成完成
      addSp1Product(productTrigger.productIndex)
      setSkillDialog((prev) => prev ? { ...prev, phase: 'done' } : null)
      await wait(1500)
      if (!autoPlayingRef.current) { setSkillDialog(null); return }

      // 关闭对话框
      setSkillDialog(null)

      if (isImmersive) {
        // 沉浸模式：在当前节点对话中显示产物生成通知
        const activeId = step.createdNodeId
        const msgs = messagesMap.current.get(activeId) || []
        msgs.push({
          role: 'assistant',
          content: productTrigger.notice,
          timestamp: new Date().toISOString()
        })
        messagesMap.current.set(activeId, [...msgs])
        setCurrentMessages([...msgs])
        await wait(1000)
        if (!autoPlayingRef.current) return

        // 切到产物视图展示
        setViewTab('products')
        await wait(3000)
        if (!autoPlayingRef.current) return

        // 切回节点视图
        setViewTab('nodes')
        await wait(500)
        if (!autoPlayingRef.current) return
      }
    }

    // 下一步
    autoStepRef.current++
    setAutoStepIndex(autoStepRef.current)
    if (autoPlayingRef.current) {
      runAutoStep()
    }
  }, [spaceId])

  const toggleAutoPlay = useCallback(() => {
    if (autoPlayingRef.current) {
      autoPlayingRef.current = false
      setAutoPlaying(false)
    } else {
      autoPlayingRef.current = true
      setAutoPlaying(true)
      runAutoStep()
    }
  }, [runAutoStep])

  // 演示模式：进入 active 后先清空再自动开始沉浸式演示
  useEffect(() => {
    if (phase === 'active' && pendingDemoStart.current) {
      pendingDemoStart.current = false
      // 先重置数据，保证干净状态（和 resetDemo 一致）
      autoPlayingRef.current = false
      setAutoPlaying(false)
      autoStepRef.current = 0
      setAutoStepIndex(0)
      setTypingText('')
      resetSp1Demo()
      messagesMap.current.clear()
      setCurrentMessages([])
      refreshTree()
      setActiveSessionId('s1-main')
      // 稍作延迟让界面渲染完毕后开始沉浸式演示
      const timer = setTimeout(() => {
        setDemoMode('immersive')
        autoPlayingRef.current = true
        setAutoPlaying(true)
        runAutoStep()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [phase, runAutoStep, refreshTree])

  // 重置演示
  const resetDemo = useCallback(() => {
    // 停止自动播放
    autoPlayingRef.current = false
    setAutoPlaying(false)
    autoStepRef.current = 0
    setAutoStepIndex(0)
    setTypingText('')
    // 重置 mock 数据
    resetSp1Demo()
    // 清空消息缓存
    messagesMap.current.clear()
    setCurrentMessages([])
    // 刷新树
    refreshTree()
    setActiveSessionId('s1-main')
  }, [refreshTree])

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  const viewTabs: { key: ViewTab; label: string }[] = [
    { key: 'nodes', label: '节点视图' },
    { key: 'products', label: '产物视图' },
    { key: 'events', label: '事件流' }
  ]

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ background: 'var(--color-paper)' }}
    >
      {/* ─── 顶栏 ─── */}
      {phase === 'active' && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-4 pl-8 pr-8 h-12"
          style={{
            background: 'var(--color-paper)',
            borderBottom: '1px solid rgba(42,42,42,0.06)'
          }}
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
            <span
              className="text-[20px] font-semibold"
              style={{ ...handFont, color: 'var(--color-ink)' }}
            >
              {space?.label || 'Kit'}
            </span>
            {space && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  ...handSm,
                  fontSize: 11,
                  background:
                    space.mode === 'AUTO'
                      ? 'rgba(58,107,197,0.1)'
                      : 'rgba(201,74,74,0.1)',
                  color:
                    space.mode === 'AUTO'
                      ? 'var(--color-blue-pen)'
                      : 'var(--color-red-pen)'
                }}
              >
                {space.mode}
              </span>
            )}
          </div>

          {/* 当前节点 + 对话/沉淀 tab */}
          {drawerOpen && activeLabel && (
            <div
              className="flex items-center gap-3"
              style={{
                borderLeft: '1px solid rgba(42,42,42,0.1)',
                paddingLeft: 16
              }}
            >
              <span
                className="text-[20px] font-semibold"
                style={{ ...handFont, color: 'var(--color-blue-pen)' }}
              >
                {activeLabel}
              </span>
              {[
                { key: 'chat' as PanelTab, label: '对话' },
                { key: 'insight' as PanelTab, label: '沉淀' }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPanelTab(t.key)}
                  className="rounded-md bg-transparent border-none cursor-pointer transition-colors"
                  style={{
                    ...handFont,
                    fontSize: 16,
                    padding: '4px 12px',
                    color:
                      panelTab === t.key
                        ? 'var(--color-blue-pen)'
                        : 'var(--color-pencil)',
                    background:
                      panelTab === t.key
                        ? 'rgba(58,107,197,0.08)'
                        : 'transparent',
                    fontWeight: panelTab === t.key ? 600 : 400
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
          <div className="flex items-center gap-3">
            {viewTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setViewTab(t.key)}
                className="rounded-md bg-transparent border-none cursor-pointer transition-colors"
                style={{
                  ...handFont,
                  fontSize: 17,
                  padding: '6px 14px',
                  color:
                    viewTab === t.key
                      ? 'var(--color-blue-pen)'
                      : 'var(--color-pencil)',
                  background:
                    viewTab === t.key ? 'rgba(58,107,197,0.1)' : 'transparent',
                  fontWeight: viewTab === t.key ? 600 : 400,
                  borderBottom:
                    viewTab === t.key
                      ? '2px solid var(--color-blue-pen)'
                      : '2px solid transparent'
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
            boxShadow: '2px 0 6px rgba(0,0,0,0.04)'
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
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform =
              'translate(-50%, -50%) scale(1.08)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')
          }
        >
          <ScribbleBall size={80} color="#3a6bc5" />
          <p
            className="mt-2 text-center"
            style={{
              fontFamily: 'var(--font-hand-sm)',
              fontSize: 14,
              color: 'var(--color-pencil)'
            }}
          >
            tap to start
          </p>
        </button>
      )}

      {/* 动画态 */}
      {phase === 'animating' && (
        <>
          <div
            className="absolute top-0 left-0 bottom-0 z-40"
            style={{
              width: '40%',
              animation: 'panelSlideIn 0.6s ease-out forwards'
            }}
          >
            <ChatPanel
              messages={isDemo ? [] : currentMessages}
              onSend={handleSend}
              sending={sending}
            />
          </div>
          <div
            className="fixed z-50 pointer-events-none"
            style={{ animation: 'ballToTopo 0.7s ease-in-out forwards' }}
          >
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
              transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="h-full" style={{ width: '40vw', minWidth: '40vw' }}>
              <ChatPanel
                messages={currentMessages}
                onSend={handleSend}
                sending={sending}
                activeTab={panelTab}
                l2Summary={currentL2}
                insights={insights}
                onInsightNodeClick={handleNodeClick}
                controlledInput={autoPlaying ? typingText : undefined}
                onControlledInputChange={autoPlaying ? setTypingText : undefined}
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
                zoom={spaceId === 'sp-1' ? canvasZoom : undefined}
                onZoomChange={spaceId === 'sp-1' ? setCanvasZoom : undefined}
                focusNodeId={focusNodeId}
              />
            )}
            {viewTab === 'products' && <ProductView spaceId={spaceId!} />}
            {viewTab === 'events' && (
              <EventStream spaceId={spaceId!} onNodeClick={handleNodeClick} />
            )}
          </div>
        </div>
      )}

      {/* 自动演示控制面板（仅 sp-1）— 可侧拉隐藏 */}
      {phase === 'active' && spaceId === 'sp-1' && (
        <div
          className="fixed z-50 flex items-center"
          style={{
            bottom: 24,
            right: demoControlOpen ? 24 : 0,
            transition: 'right 0.3s ease'
          }}
        >
          {/* 收起/展开小把手 */}
          <button
            onClick={() => setDemoControlOpen((v) => !v)}
            className="cursor-pointer flex items-center justify-center"
            style={{
              width: 24,
              height: 48,
              background: 'rgba(42,42,42,0.08)',
              border: '1px solid rgba(42,42,42,0.12)',
              borderRight: demoControlOpen ? 'none' : undefined,
              borderRadius: '8px 0 0 8px',
              color: 'var(--color-pencil)'
            }}
          >
            {demoControlOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* 控制面板主体 */}
          <div
            className="flex items-center gap-3 overflow-hidden"
            style={{
              width: demoControlOpen ? 'auto' : 0,
              opacity: demoControlOpen ? 1 : 0,
              padding: demoControlOpen ? '8px 14px' : '8px 0',
              background: 'var(--color-paper)',
              border: '1px solid rgba(42,42,42,0.12)',
              borderRadius: '12px 0 12px 12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'width 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {/* 进度 */}
            <span
              style={{
                fontFamily: 'var(--font-hand-sm)',
                fontSize: 13,
                color: 'var(--color-pencil)',
                minWidth: 50
              }}
            >
              {autoStepIndex}/{sp1AutoDemo.length}
            </span>

            {/* 播放/暂停 */}
            <button
              onClick={toggleAutoPlay}
              disabled={autoStepIndex >= sp1AutoDemo.length}
              className="cursor-pointer flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-40"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: autoPlaying ? 'rgba(201,74,74,0.12)' : 'rgba(58,107,197,0.12)',
                color: autoPlaying ? 'var(--color-red-pen)' : 'var(--color-blue-pen)',
                border: `1.5px solid ${autoPlaying ? 'rgba(201,74,74,0.25)' : 'rgba(58,107,197,0.25)'}`
              }}
              title={autoPlaying ? '暂停' : '播放'}
            >
              {autoPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* 重置 */}
            <button
              onClick={resetDemo}
              disabled={autoPlaying}
              className="cursor-pointer flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-40"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(42,42,42,0.06)',
                color: 'var(--color-pencil)',
                border: '1.5px solid rgba(42,42,42,0.12)'
              }}
              title="重置演示"
            >
              <RotateCcw size={15} />
            </button>

            {/* 分隔线 */}
            <div style={{ width: 1, height: 24, background: 'rgba(42,42,42,0.12)' }} />

            {/* 模式切换 */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(42,42,42,0.12)' }}
            >
              {([
                { key: 'fast' as const, label: '快速' },
                { key: 'immersive' as const, label: '沉浸' }
              ]).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setDemoMode(m.key)}
                  disabled={autoPlaying}
                  className="cursor-pointer disabled:opacity-40"
                  style={{
                    padding: '4px 10px',
                    fontFamily: 'var(--font-hand-sm)',
                    fontSize: 12,
                    border: 'none',
                    background: demoMode === m.key ? 'rgba(58,107,197,0.15)' : 'transparent',
                    color: demoMode === m.key ? 'var(--color-blue-pen)' : 'var(--color-pencil)',
                    fontWeight: demoMode === m.key ? 600 : 400
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* 播放速度（沉浸模式时显示） */}
            {demoMode === 'immersive' && (
              <>
                <div style={{ width: 1, height: 24, background: 'rgba(42,42,42,0.12)' }} />
                <div
                  className="flex rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(42,42,42,0.12)' }}
                >
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaySpeed(s)}
                      disabled={autoPlaying}
                      className="cursor-pointer disabled:opacity-40"
                      style={{
                        padding: '4px 8px',
                        fontFamily: 'var(--font-hand-sm)',
                        fontSize: 12,
                        border: 'none',
                        background: playSpeed === s ? 'rgba(126,87,194,0.15)' : 'transparent',
                        color: playSpeed === s ? '#7E57C2' : 'var(--color-pencil)',
                        fontWeight: playSpeed === s ? 600 : 400
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 分隔线 */}
            <div style={{ width: 1, height: 24, background: 'rgba(42,42,42,0.12)' }} />

            {/* 缩放滑条 */}
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'var(--font-hand-sm)',
                  fontSize: 12,
                  color: 'var(--color-pencil)',
                  minWidth: 36,
                  textAlign: 'right'
                }}
              >
                {Math.round(canvasZoom * 100)}%
              </span>
              <input
                type="range"
                min={30}
                max={200}
                value={Math.round(canvasZoom * 100)}
                onChange={(e) => setCanvasZoom(Number(e.target.value) / 100)}
                style={{
                  width: 90,
                  accentColor: 'var(--color-blue-pen)',
                  cursor: 'pointer'
                }}
                title="缩放"
              />
            </div>
          </div>
        </div>
      )}

      {/* Skill 调用对话框 */}
      {skillDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="relative"
            style={{
              width: 420,
              background: 'var(--color-paper)',
              border: '2px solid rgba(42,42,42,0.15)',
              borderRadius: 16,
              padding: '28px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {/* 标题行 */}
            <div className="flex items-center gap-2 mb-4">
              <span style={{ fontSize: 20 }}>
                {skillDialog.phase === 'done' ? '\u2705' : '\u2699\ufe0f'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--color-ink)'
                }}
              >
                {skillDialog.phase === 'done' ? 'Skill 执行完成' : '正在调用 Skill'}
              </span>
            </div>

            {/* Skill 名称 */}
            <div
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(126,87,194,0.08)',
                border: '1px solid rgba(126,87,194,0.15)'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 14,
                  color: '#7E57C2',
                  fontWeight: 600
                }}
              >
                {skillDialog.skillName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-hand-sm)',
                  fontSize: 12,
                  color: 'var(--color-pencil)',
                  marginLeft: 'auto'
                }}
              >
                {skillDialog.skillDesc}
              </span>
            </div>

            {/* 阶段 1: 收集节点 */}
            <div className="flex items-start gap-2 mb-2">
              <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>
                {skillDialog.phase === 'collecting' ? '\u23f3' : '\u2713'}
              </span>
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-hand-sm)',
                    fontSize: 13,
                    color: skillDialog.phase === 'collecting' ? 'var(--color-ink)' : 'var(--color-pencil)'
                  }}
                >
                  收集关联节点讨论内容
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                    {skillDialog.sourceNodes.map((node, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          fontFamily: 'var(--font-hand-sm)',
                          fontSize: 11,
                          background: 'rgba(58,107,197,0.08)',
                          border: '1px solid rgba(58,107,197,0.15)',
                          color: 'var(--color-blue-pen)',
                          opacity: skillDialog.phase === 'collecting' ? 1 : 0.6,
                          animation: skillDialog.phase === 'collecting'
                            ? `fadeIn 0.3s ease-out ${i * 0.15}s both`
                            : undefined
                        }}
                      >
                        {node}
                      </span>
                    ))}
                  </div>
              </div>
            </div>

            {/* 阶段 2: 生成中 */}
            <div className="flex items-start gap-2 mb-2">
              <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>
                {skillDialog.phase === 'collecting'
                  ? '\u25cb'
                  : skillDialog.phase === 'generating'
                    ? '\u23f3'
                    : '\u2713'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-hand-sm)',
                  fontSize: 13,
                  color: skillDialog.phase === 'generating' ? 'var(--color-ink)' : 'var(--color-pencil)',
                  opacity: skillDialog.phase === 'collecting' ? 0.4 : 1
                }}
              >
                AI 分析并生成文档...
              </span>
            </div>

            {/* 阶段 3: 完成 */}
            <div className="flex items-start gap-2 mb-4">
              <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>
                {skillDialog.phase === 'done' ? '\u2713' : '\u25cb'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-hand-sm)',
                  fontSize: 13,
                  color: skillDialog.phase === 'done' ? 'var(--color-ink)' : 'var(--color-pencil)',
                  opacity: skillDialog.phase === 'done' ? 1 : 0.4
                }}
              >
                输出产物
              </span>
            </div>

            {/* 产物名称（完成时显示） */}
            {skillDialog.phase === 'done' && (
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(91,168,91,0.08)',
                  border: '1px solid rgba(91,168,91,0.15)',
                  fontFamily: 'var(--font-hand)',
                  fontSize: 14,
                  color: 'var(--color-green-hl)',
                  fontWeight: 600,
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {skillDialog.productTitle}
              </div>
            )}

            {/* 加载动画条（未完成时显示） */}
            {skillDialog.phase !== 'done' && (
              <div
                className="mt-2 rounded-full overflow-hidden"
                style={{ height: 3, background: 'rgba(126,87,194,0.1)' }}
              >
                <div
                  style={{
                    height: '100%',
                    width: skillDialog.phase === 'collecting' ? '40%' : '80%',
                    background: '#7E57C2',
                    borderRadius: 999,
                    transition: 'width 1.5s ease',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
              </div>
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
