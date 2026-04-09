import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  GitFork,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Copy,
  MoreHorizontal
} from 'lucide-react'
import {
  listSpaces,
  createSpace,
  deleteSpace,
  updateSpace,
  getSessionTree,
  listMarketKits,
  forkMarketKit,
  listPublished,
  publishSpace,
  type Space,
  type SpaceMode,
  type SessionTreeNode,
  type MarketKit,
  type PublishedKit
} from '../lib/api'

type Tab = 'spaces' | 'market' | 'workshop'

/* ─── 极简弹窗 ─── */
function Modal({
  open,
  onClose,
  children,
  wide
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(42,42,42,0.25)' }}
      onClick={onClose}
    >
      <div
        className={`relative w-full mx-4 rounded-lg ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{
          background: 'var(--color-paper)',
          border: '1.5px solid var(--color-ink)',
          padding: '28px 32px',
          boxShadow: '4px 4px 20px rgba(0,0,0,0.08)',
          transform: 'rotate(-0.3deg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-transparent border-none cursor-pointer p-1"
          style={{ color: 'var(--color-pencil)' }}
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}

/* ─── 右键菜单 ─── */
function ContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDelete,
  onDuplicate,
  onPublish
}: {
  x: number
  y: number
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  onDuplicate: () => void
  onPublish: () => void
}) {
  const handSm = { fontFamily: 'var(--font-hand-sm)' }
  const items = [
    { label: '重命名', icon: <Pencil size={14} />, action: onRename },
    { label: '复制', icon: <Copy size={14} />, action: onDuplicate },
    { label: '发布到 Market', icon: <Upload size={14} />, action: onPublish },
    {
      label: '删除',
      icon: <Trash2 size={14} />,
      action: onDelete,
      danger: true
    }
  ]
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={onClose} />
      <div
        className="fixed z-[201] rounded-lg py-1 min-w-[160px]"
        style={{
          left: x,
          top: y,
          background: 'var(--color-paper)',
          border: '1.5px solid rgba(42,42,42,0.15)',
          boxShadow: '4px 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.action()
              onClose()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 bg-transparent border-none cursor-pointer text-left hover:bg-black/5 transition-colors"
            style={{
              ...handSm,
              fontSize: 14,
              color: item.danger ? 'var(--color-red-pen)' : 'var(--color-ink)'
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

/** 收集树的前 N 个节点标签（BFS） */
function collectNodeLabels(tree: SessionTreeNode[], max = 6): string[] {
  const labels: string[] = []
  const queue = [...tree]
  while (queue.length > 0 && labels.length < max) {
    const node = queue.shift()!
    labels.push(node.label)
    queue.push(...node.children)
  }
  return labels
}

/** 统计树的总节点数 */
function countNodes(tree: SessionTreeNode[]): number {
  let count = 0
  const queue = [...tree]
  while (queue.length > 0) {
    const node = queue.shift()!
    count++
    queue.push(...node.children)
  }
  return count
}

/** 统计模板进度（已激活/总预设节点） */
function countActivation(
  tree: SessionTreeNode[]
): { activated: number; total: number } | null {
  let activated = 0,
    total = 0,
    hasTemplate = false
  const queue = [...tree]
  while (queue.length > 0) {
    const node = queue.shift()!
    if (node.activationStatus) {
      hasTemplate = true
      total++
      if (node.activationStatus === 'activated') activated++
    }
    queue.push(...node.children)
  }
  return hasTemplate ? { activated, total } : null
}

/** 时间相对描述 */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

// 便签卡片样式变体
const ROTATIONS = ['-1.2deg', '0.8deg', '-0.6deg', '1.1deg', '-0.4deg', '0.9deg']
const WOBBLY_RADII = [
  '15px 25px 20px 10px', '20px 15px 25px 12px', '12px 20px 15px 25px',
  '25px 12px 18px 15px', '18px 22px 12px 20px', '14px 18px 22px 16px',
]
const TAPE_ROTATIONS = ['-2deg', '1.5deg', '-3deg', '2deg', '-1deg', '3deg']

function stickyStyle(idx: number, extra?: React.CSSProperties): React.CSSProperties {
  return {
    padding: '24px 28px 32px',
    background: '#FFF9C4',
    border: '2.5px solid rgba(45,45,45,0.12)',
    borderRadius: WOBBLY_RADII[idx % WOBBLY_RADII.length],
    boxShadow: '4px 4px 0 rgba(45,45,45,0.08)',
    transform: `rotate(${ROTATIONS[idx % ROTATIONS.length]})`,
    ...extra,
  }
}

const EMOJI_OPTIONS = [
  '💡',
  '🧠',
  '⚙️',
  '📊',
  '🎯',
  '🚀',
  '📝',
  '🎨',
  '🔬',
  '🌟',
  '📦',
  '🛠️'
]
const COLOR_OPTIONS = [
  '#3a6bc5',
  '#c94a4a',
  '#5ba85b',
  '#c78a30',
  '#7E57C2',
  '#e91e8c'
]

export function Home() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('spaces')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [spaceTrees, setSpaceTrees] = useState<
    Record<string, SessionTreeNode[]>
  >({})
  const [loading, setLoading] = useState(true)

  // Market
  const [marketKits, setMarketKits] = useState<MarketKit[]>([])
  const [forkTarget, setForkTarget] = useState<MarketKit | null>(null)
  const [forkName, setForkName] = useState('')
  const [forking, setForking] = useState(false)

  // Workshop
  const [published, setPublished] = useState<PublishedKit[]>([])
  const [showPublish, setShowPublish] = useState(false)
  const [pubSpaceId, setPubSpaceId] = useState('')
  const [pubLabel, setPubLabel] = useState('')
  const [pubDesc, setPubDesc] = useState('')
  const [pubTags, setPubTags] = useState('')
  const [pubModel, setPubModel] = useState('claude-sonnet-4-6')
  const [pubVisibility, setPubVisibility] = useState<'public' | 'unlisted'>(
    'public'
  )
  const [pubSystemPrompt, setPubSystemPrompt] = useState('')
  const [pubAllowFork, setPubAllowFork] = useState(true)
  const [pubMaxDepth, setPubMaxDepth] = useState('5')
  const [publishing, setPublishing] = useState(false)

  // 创建 Kit Modal
  const [showCreate, setShowCreate] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('💡')
  const [newColor, setNewColor] = useState('#3a6bc5')
  const [newDesc, setNewDesc] = useState('')
  const [newMode, setNewMode] = useState<SpaceMode>('AUTO')
  const [newDeliverables, setNewDeliverables] = useState('')
  const [newSystemPrompt, setNewSystemPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [creating, setCreating] = useState(false)

  // 右键菜单
  const [ctxMenu, setCtxMenu] = useState<{
    x: number
    y: number
    space: Space
  } | null>(null)

  const refreshSpaces = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSpaces()
      const spaceList = data.spaces || []
      setSpaces(spaceList)
      const trees: Record<string, SessionTreeNode[]> = {}
      await Promise.all(
        spaceList.map(async (s) => {
          try {
            const t = await getSessionTree(s.id)
            trees[s.id] = t.tree
          } catch {
            /* ignore */
          }
        })
      )
      setSpaceTrees(trees)
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshSpaces()
  }, [refreshSpaces])

  useEffect(() => {
    if (tab === 'market') {
      listMarketKits()
        .then((d) => setMarketKits(d.kits))
        .catch(() => {})
    } else if (tab === 'workshop') {
      listPublished()
        .then((d) => setPublished(d.kits))
        .catch(() => {})
      refreshSpaces()
    }
  }, [tab, refreshSpaces])

  // 创建 Kit
  const handleCreate = async () => {
    if (!newLabel.trim() || creating) return
    setCreating(true)
    try {
      const { space } = await createSpace({
        label: newLabel.trim(),
        emoji: newEmoji,
        color: newColor,
        mode: newMode,
        description: newDesc.trim(),
        deliverables: newDeliverables.split(/[,，\s]+/).filter(Boolean),
        systemPrompt: newSystemPrompt
      })
      setShowCreate(false)
      navigate(`/space/${space.id}?new`)
    } catch {
      alert('创建失败')
    }
    setCreating(false)
  }

  const openCreate = () => {
    setNewLabel('')
    setNewEmoji('💡')
    setNewColor('#3a6bc5')
    setNewDesc('')
    setNewMode('AUTO')
    setNewDeliverables('')
    setNewSystemPrompt('')
    setShowAdvanced(false)
    setShowCreate(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该空间？')) return
    try {
      await deleteSpace(id)
      refreshSpaces()
    } catch {
      alert('删除失败')
    }
  }

  // Fork 流程
  const openFork = (kit: MarketKit) => {
    setForkTarget(kit)
    setForkName(kit.label)
  }

  const handleFork = async () => {
    if (!forkTarget || forking) return
    setForking(true)
    try {
      const { space } = await forkMarketKit(
        forkTarget.id,
        forkName.trim() || undefined
      )
      setForkTarget(null)
      navigate(`/space/${space.id}`)
    } catch {
      alert('Fork failed')
    }
    setForking(false)
  }

  // Publish 流程
  const openPublish = () => {
    setPubSpaceId(spaces[0]?.id || '')
    setPubLabel('')
    setPubDesc('')
    setPubTags('')
    setPubModel('claude-sonnet-4-6')
    setPubVisibility('public')
    setPubSystemPrompt('')
    setPubAllowFork(true)
    setPubMaxDepth('5')
    setShowPublish(true)
  }

  const handlePublish = async () => {
    if (!pubSpaceId || !pubLabel.trim() || publishing) return
    setPublishing(true)
    try {
      await publishSpace(pubSpaceId, {
        label: pubLabel.trim(),
        description: pubDesc.trim(),
        tags: pubTags.split(/[,，\s]+/).filter(Boolean)
      })
      setShowPublish(false)
      const d = await listPublished()
      setPublished(d.kits)
    } catch {
      alert('Publish failed')
    }
    setPublishing(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'spaces', label: 'Kit Spaces' },
    { key: 'market', label: 'Kit Market' },
    { key: 'workshop', label: 'Kit Workshop' }
  ]

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handAlt = { fontFamily: 'var(--font-hand-alt)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, space: Space) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, space })
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'var(--color-paper)' }}
    >
      {/* 顶部导航 */}
      <nav
        className="flex items-center pt-8 pb-4"
        style={{
          ...handFont,
          fontSize: 26,
          marginBottom: 8,
          paddingLeft: 20,
          paddingRight: 20
        }}
      >
        <span
          className="text-[36px] font-bold shrink-0"
          style={{
            color: 'var(--color-ink)',
            transform: 'rotate(-2deg)',
            display: 'inline-block'
          }}
        >
          MindKit
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-8">
          {tabs.map((t) => {
            const active = tab === t.key
            const uid = `brush-${t.key}`
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative bg-transparent border-none cursor-pointer py-1 px-1 transition-all"
                style={{
                  color: active ? 'var(--color-ink)' : 'var(--color-pencil)',
                  ...handFont,
                  fontSize: 24
                }}
              >
                {active && (
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      left: '-12%',
                      top: '-25%',
                      width: '130%',
                      height: '150%',
                      overflow: 'visible'
                    }}
                    viewBox="0 0 200 50"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id={`${uid}-fade`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3a6bc5"
                          stopOpacity="0.42"
                        />
                        <stop
                          offset="45%"
                          stopColor="#3a6bc5"
                          stopOpacity="0.35"
                        />
                        <stop
                          offset="70%"
                          stopColor="#3a6bc5"
                          stopOpacity="0.18"
                        />
                        <stop
                          offset="88%"
                          stopColor="#3a6bc5"
                          stopOpacity="0.06"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3a6bc5"
                          stopOpacity="0"
                        />
                      </linearGradient>
                      <filter
                        id={`${uid}-tex`}
                        x="-5%"
                        y="-30%"
                        width="110%"
                        height="160%"
                      >
                        <feTurbulence
                          type="fractalNoise"
                          baseFrequency="0.03 0.08"
                          numOctaves="4"
                          seed="5"
                          result="noise"
                        />
                        <feColorMatrix
                          type="luminanceToAlpha"
                          in="noise"
                          result="noiseA"
                        />
                        <feComponentTransfer in="noiseA" result="cutoff">
                          <feFuncA
                            type="discrete"
                            tableValues="0 0 0 1 1 1 1 1"
                          />
                        </feComponentTransfer>
                        <feComposite
                          in="SourceGraphic"
                          in2="cutoff"
                          operator="in"
                        />
                      </filter>
                      <filter
                        id={`${uid}-dry`}
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                      >
                        <feTurbulence
                          type="fractalNoise"
                          baseFrequency="0.05 0.2"
                          numOctaves="3"
                          seed="11"
                          result="dry"
                        />
                        <feColorMatrix
                          type="luminanceToAlpha"
                          in="dry"
                          result="dryA"
                        />
                        <feComponentTransfer in="dryA" result="dryMask">
                          <feFuncA
                            type="discrete"
                            tableValues="0 0 1 1 1 1 1 1 1"
                          />
                        </feComponentTransfer>
                        <feComposite
                          in="SourceGraphic"
                          in2="dryMask"
                          operator="in"
                        />
                      </filter>
                    </defs>
                    <path
                      d="M2 25 C8 17, 18 30, 45 23 S75 16, 105 25 S145 19, 170 26 C180 27, 190 24, 200 25"
                      fill="none"
                      stroke={`url(#${uid}-fade)`}
                      strokeWidth="36"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#${uid}-tex)`}
                    />
                    <path
                      d="M8 26 C25 19, 50 32, 85 23 S125 17, 160 26 C175 28, 190 23, 198 25"
                      fill="none"
                      stroke="#3a6bc5"
                      strokeOpacity="0.1"
                      strokeWidth="22"
                      strokeLinecap="round"
                      filter={`url(#${uid}-dry)`}
                    />
                    <path
                      d="M4 10 Q22 6, 50 9 T100 8 T150 10 Q175 9, 195 11"
                      fill="none"
                      stroke="#3a6bc5"
                      strokeOpacity="0.07"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 40 Q30 44, 60 41 T110 42 T160 40 Q180 41, 196 39"
                      fill="none"
                      stroke="#3a6bc5"
                      strokeOpacity="0.05"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
      </nav>

      {/* ─── My Space ─── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center pb-8"
        style={{ paddingTop: 16 }}
      >
        {tab === 'spaces' && (
          <div className="w-full max-w-3xl px-6">
            {/* 标题区 */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <h1
                  className="text-[32px] font-bold"
                  style={{
                    ...handFont,
                    color: 'var(--color-ink)',
                    transform: 'rotate(-1deg)',
                    display: 'inline-block'
                  }}
                >
                  My Space
                </h1>
                <p
                  style={{
                    ...handAlt,
                    fontSize: 16,
                    color: 'var(--color-pencil)',
                    marginTop: 2
                  }}
                >
                  你的 AI 认知空间集合
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] border-none"
                style={{
                  ...handFont,
                  fontSize: 17,
                  padding: '8px 10px',
                  background: 'var(--color-blue-pen)',
                  color: '#fff'
                }}
              >
                <Plus size={18} />
                创建新空间
              </button>
            </div>

            {/* 空状态 */}
            {!loading && spaces.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <p
                  style={{
                    ...handFont,
                    fontSize: 24,
                    color: 'var(--color-pencil)',
                    marginBottom: 16
                  }}
                >
                  还没有任何空间
                </p>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] border-none mb-4"
                  style={{
                    ...handFont,
                    fontSize: 20,
                    background: 'var(--color-blue-pen)',
                    color: '#fff'
                  }}
                >
                  <Plus size={20} />
                  创建你的第一个 Kit
                </button>
                <button
                  onClick={() => setTab('market')}
                  className="bg-transparent border-none cursor-pointer underline"
                  style={{
                    ...handAlt,
                    fontSize: 16,
                    color: 'var(--color-blue-pen)'
                  }}
                >
                  或去 Kit Market 探索他人的 Kit
                </button>
              </div>
            )}

            {/* 卡片网格 */}
            {spaces.length > 0 && (
              <div
                className="grid gap-5"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
                }}
              >
                {loading && spaces.length === 0 && (
                  <p
                    style={{
                      ...handAlt,
                      fontSize: 18,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    loading...
                  </p>
                )}
                {spaces.map((space, idx) => (
                    <div
                      key={space.id}
                      onClick={() => navigate(`/space/${space.id}`)}
                      onContextMenu={(e) => handleContextMenu(e, space)}
                      className="sticky-note tape-top relative cursor-pointer transition-transform hover:scale-[1.03] group"
                      style={stickyStyle(idx, { minHeight: 200 })}
                    >
                      <span className="tape" style={{ transform: `translateX(-50%) rotate(${TAPE_ROTATIONS[idx % TAPE_ROTATIONS.length]})` }} />
                      {/* Emoji + 标题 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[24px]">{space.emoji}</span>
                        <h3
                          className="text-[24px] font-semibold"
                          style={{
                            ...handFont,
                            color: 'var(--color-blue-pen)'
                          }}
                        >
                          {space.label}
                        </h3>
                      </div>
                      {/* 模式标签 + 来源 */}
                      <div className="flex items-center gap-2 mb-2">
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
                                : 'var(--color-red-pen)',
                            border: `1px solid ${space.mode === 'AUTO' ? 'rgba(58,107,197,0.2)' : 'rgba(201,74,74,0.2)'}`
                          }}
                        >
                          {space.mode}
                        </span>
                        {space.sourceKitId && (
                          <span
                            style={{
                              ...handSm,
                              fontSize: 11,
                              color: 'var(--color-pencil)'
                            }}
                          >
                            from template
                          </span>
                        )}
                      </div>
                      {space.description && (
                        <p
                          className="mb-3 line-clamp-2"
                          style={{
                            ...handAlt,
                            fontSize: 15,
                            color: 'var(--color-ink)',
                            lineHeight: 1.6
                          }}
                        >
                          {space.description}
                        </p>
                      )}
                      {/* 拓扑节点标签 */}
                      {spaceTrees[space.id] &&
                        spaceTrees[space.id].length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {collectNodeLabels(spaceTrees[space.id]).map(
                              (label, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full"
                                  style={{
                                    ...handSm,
                                    fontSize: 12,
                                    background:
                                      i === 0
                                        ? 'rgba(58,107,197,0.12)'
                                        : 'rgba(42,42,42,0.06)',
                                    color:
                                      i === 0
                                        ? 'var(--color-blue-pen)'
                                        : 'var(--color-ink)',
                                    border: `1px solid ${i === 0 ? 'rgba(58,107,197,0.2)' : 'rgba(42,42,42,0.08)'}`
                                  }}
                                >
                                  {label}
                                </span>
                              )
                            )}
                            {countNodes(spaceTrees[space.id]) > 6 && (
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  ...handSm,
                                  fontSize: 12,
                                  color: 'var(--color-pencil)'
                                }}
                              >
                                +{countNodes(spaceTrees[space.id]) - 6}
                              </span>
                            )}
                          </div>
                        )}
                      {/* 底部信息 */}
                      <div
                        className="flex items-center gap-3"
                        style={{
                          ...handSm,
                          fontSize: 13,
                          color: 'var(--color-pencil)'
                        }}
                      >
                        <span>{timeAgo(space.lastActiveAt)}</span>
                        {spaceTrees[space.id] && (
                          <span>
                            · {countNodes(spaceTrees[space.id])} 个节点
                          </span>
                        )}
                        {spaceTrees[space.id] &&
                          (() => {
                            const progress = countActivation(
                              spaceTrees[space.id]
                            )
                            if (!progress) return null
                            return (
                              <span
                                style={{
                                  color:
                                    progress.activated >= progress.total
                                      ? 'var(--color-green-hl)'
                                      : 'var(--color-blue-pen)'
                                }}
                              >
                                · {progress.activated}/{progress.total} 已完成
                              </span>
                            )
                          })()}
                      </div>
                      {/* 更多按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContextMenu(e, space)
                        }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity bg-transparent border-none cursor-pointer p-1"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        <MoreHorizontal size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Kit 广场 ─── */}
        {tab === 'market' && (
          <div className="w-full max-w-4xl px-6 mx-auto">
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
              }}
            >
              {marketKits.map((kit, idx) => (
                  <div
                    key={kit.id}
                    className="sticky-note tape-top relative flex flex-col overflow-hidden transition-transform hover:scale-[1.03]"
                    style={stickyStyle(idx, { minHeight: 200 })}
                  >
                    <span className="tape" style={{ transform: `translateX(-50%) rotate(${TAPE_ROTATIONS[idx % TAPE_ROTATIONS.length]})` }} />
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3
                        className="text-[20px] font-semibold"
                        style={{ ...handFont, color: 'var(--color-blue-pen)' }}
                      >
                        {kit.label}
                      </h3>
                      <div className="flex gap-1.5 shrink-0 mt-1">
                        {kit.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              ...handSm,
                              fontSize: 11,
                              lineHeight: '16px',
                              background:
                                tag === 'AUTO'
                                  ? 'rgba(58,107,197,0.1)'
                                  : tag === 'PRO'
                                    ? 'rgba(201,74,74,0.1)'
                                    : 'rgba(42,42,42,0.06)',
                              color:
                                tag === 'AUTO'
                                  ? 'var(--color-blue-pen)'
                                  : tag === 'PRO'
                                    ? 'var(--color-red-pen)'
                                    : 'var(--color-ink)',
                              border: `1px solid ${tag === 'AUTO' ? 'rgba(58,107,197,0.2)' : tag === 'PRO' ? 'rgba(201,74,74,0.2)' : 'rgba(42,42,42,0.1)'}`
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p
                      className="mb-4"
                      style={{
                        ...handAlt,
                        fontSize: 16,
                        color: 'var(--color-ink)',
                        lineHeight: 1.5
                      }}
                    >
                      {kit.description}
                    </p>
                    <div
                      className="flex flex-col gap-3 mt-auto pt-2"
                      style={{ borderTop: '1px dashed rgba(42,42,42,0.12)' }}
                    >
                      <span
                        style={{
                          ...handSm,
                          fontSize: 13,
                          color: 'var(--color-pencil)'
                        }}
                      >
                        by {kit.author} · {kit.forks} forks
                      </span>
                      <button
                        onClick={() => openFork(kit)}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] border-none"
                        style={{
                          ...handFont,
                          fontSize: 18,
                          background: 'var(--color-blue-pen)',
                          color: '#fff'
                        }}
                      >
                        <GitFork size={16} />
                        Fork
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ─── Kit 工坊 ─── */}
        {tab === 'workshop' && (
          <div className="w-full max-w-xl px-6 mx-auto">
            <button
              onClick={openPublish}
              className="flex items-center gap-3 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] border-none"
              style={{
                ...handFont,
                fontSize: 18,
                padding: '8px 10px',
                background: 'var(--color-blue-pen)',
                color: '#fff',
                boxShadow: '2px 2px 0 rgba(45,45,45,0.08)',
                marginBottom: 30
              }}
            >
              <Upload size={18} />
              发布新 Kit
            </button>

            {published.length === 0 ? (
              <p
                className="mt-12 text-center"
                style={{
                  ...handFont,
                  fontSize: 20,
                  color: 'var(--color-pencil)'
                }}
              >
                还没有发布过 Kit，试试把你的 Space 分享给大家吧
              </p>
            ) : (
              <div className="flex flex-col gap-5 ">
                {published.map((kit, idx) => (
                    <div
                      key={kit.id}
                      className="sticky-note tape-top relative flex items-center gap-6 cursor-pointer transition-transform hover:scale-[1.02]"
                      style={stickyStyle(idx, { padding: '24px 28px' })}
                    >
                      <div className="tape" />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-[18px] font-semibold mb-1"
                          style={{
                            ...handFont,
                            color: 'var(--color-blue-pen)'
                          }}
                        >
                          {kit.label}
                        </h3>
                        <p
                          className="truncate"
                          style={{
                            ...handAlt,
                            fontSize: 16,
                            color: 'var(--color-ink)'
                          }}
                        >
                          {kit.description}
                        </p>
                      </div>
                      <div
                        className="shrink-0 text-right"
                        style={{
                          ...handSm,
                          fontSize: 12,
                          color: 'var(--color-pencil)'
                        }}
                      >
                        <div>{kit.forks} forks</div>
                        <div>
                          {new Date(kit.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {kit.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              ...handSm,
                              fontSize: 11,
                              background:
                                tag === 'AUTO'
                                  ? 'rgba(58,107,197,0.1)'
                                  : 'rgba(201,74,74,0.1)',
                              color:
                                tag === 'AUTO'
                                  ? 'var(--color-blue-pen)'
                                  : 'var(--color-red-pen)'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 创建 Kit Modal ─── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} wide>
        <div className="flex gap-8">
          {/* 左栏：基础配置 */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-[26px] font-bold mb-5"
              style={{ ...handFont, color: 'var(--color-ink)' }}
            >
              创建新空间
            </h2>

            {/* Emoji + 颜色 */}
            <div className="flex gap-6 mb-5">
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    ...handSm,
                    fontSize: 13,
                    color: 'var(--color-pencil)'
                  }}
                >
                  图标
                </label>
                <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer border-none text-[18px] transition-transform hover:scale-110"
                      style={{
                        background:
                          newEmoji === e
                            ? 'rgba(58,107,197,0.15)'
                            : 'transparent',
                        outline:
                          newEmoji === e
                            ? '2px solid var(--color-blue-pen)'
                            : 'none'
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    ...handSm,
                    fontSize: 13,
                    color: 'var(--color-pencil)'
                  }}
                >
                  颜色
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="w-7 h-7 rounded-full cursor-pointer border-none transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline:
                          newColor === c
                            ? '2.5px solid var(--color-ink)'
                            : '1.5px solid rgba(42,42,42,0.15)',
                        outlineOffset: 2
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 名称 */}
            <label
              className="block mb-1"
              style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
            >
              空间名称 *
            </label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="给空间起个名字"
              className="w-full border-none outline-none bg-transparent mb-4"
              style={{
                borderBottom: '1.5px solid var(--color-pencil)',
                padding: '6px 2px',
                ...handFont,
                fontSize: 20,
                color: 'var(--color-blue-pen)'
              }}
            />

            {/* 主题描述 */}
            <label
              className="block mb-1"
              style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
            >
              主题描述
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="你想探索什么话题？"
              rows={2}
              className="w-full border-none outline-none bg-transparent mb-4 resize-none"
              style={{
                borderBottom: '1.5px solid var(--color-pencil)',
                padding: '6px 2px',
                ...handAlt,
                fontSize: 16,
                color: 'var(--color-ink)'
              }}
            />

            {/* 预期产物 */}
            <label
              className="block mb-1"
              style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
            >
              预期产物（逗号分隔，可选）
            </label>
            <input
              value={newDeliverables}
              onChange={(e) => setNewDeliverables(e.target.value)}
              placeholder="PRD 文档, 技术方案, 竞品分析"
              className="w-full border-none outline-none bg-transparent mb-4"
              style={{
                borderBottom: '1.5px solid var(--color-pencil)',
                padding: '6px 2px',
                ...handFont,
                fontSize: 16,
                color: 'var(--color-ink)'
              }}
            />

            {/* 模式选择 */}
            <label
              className="block mb-2"
              style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
            >
              空间模式
            </label>
            <div className="flex gap-3 mb-5">
              {(['AUTO', 'PRO'] as SpaceMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setNewMode(m)}
                  className="flex-1 py-2.5 rounded-lg cursor-pointer border-2 transition-all"
                  style={{
                    ...handFont,
                    fontSize: 16,
                    borderColor:
                      newMode === m
                        ? m === 'AUTO'
                          ? 'var(--color-blue-pen)'
                          : 'var(--color-red-pen)'
                        : 'rgba(42,42,42,0.1)',
                    background:
                      newMode === m
                        ? m === 'AUTO'
                          ? 'rgba(58,107,197,0.08)'
                          : 'rgba(201,74,74,0.08)'
                        : 'transparent',
                    color:
                      newMode === m
                        ? m === 'AUTO'
                          ? 'var(--color-blue-pen)'
                          : 'var(--color-red-pen)'
                        : 'var(--color-pencil)'
                  }}
                >
                  <div className="font-semibold">{m}</div>
                  <div style={{ ...handSm, fontSize: 12 }}>
                    {m === 'AUTO' ? 'AI 自动分裂节点' : '分裂前请求确认'}
                  </div>
                </button>
              ))}
            </div>

            {/* 创建按钮 */}
            <button
              onClick={handleCreate}
              disabled={!newLabel.trim() || creating}
              className="w-full py-2.5 rounded-md border-none cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              style={{
                ...handFont,
                fontSize: 18,
                background: 'var(--color-blue-pen)',
                color: '#fff'
              }}
            >
              {creating ? '创建中...' : '创建空间'}
            </button>
          </div>

          {/* 右栏：高级选项 */}
          <div
            className="w-52 shrink-0 border-l pl-6"
            style={{ borderColor: 'rgba(42,42,42,0.08)' }}
          >
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer mb-3"
              style={{
                ...handFont,
                fontSize: 16,
                color: 'var(--color-pencil)'
              }}
            >
              <ChevronRight
                size={16}
                style={{
                  transform: showAdvanced ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              />
              高级选项
            </button>
            {showAdvanced && (
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    className="block mb-1"
                    style={{
                      ...handSm,
                      fontSize: 12,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    System Prompt
                  </label>
                  <textarea
                    value={newSystemPrompt}
                    onChange={(e) => setNewSystemPrompt(e.target.value)}
                    placeholder="自定义 Agent 行为..."
                    rows={4}
                    className="w-full border-none outline-none bg-transparent resize-none"
                    style={{
                      borderBottom: '1px solid var(--color-pencil)',
                      padding: '4px 2px',
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-ink)'
                    }}
                  />
                </div>
                <p
                  style={{
                    ...handSm,
                    fontSize: 12,
                    color: 'var(--color-pencil)',
                    lineHeight: 1.5
                  }}
                >
                  更多配置项（模型选择、分裂策略、记忆层级等）将在后续版本中开放
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ─── Fork 弹窗 ─── */}
      <Modal open={!!forkTarget} onClose={() => setForkTarget(null)}>
        {forkTarget && (
          <>
            <h2
              className="text-[24px] font-bold mb-1"
              style={{ ...handFont, color: 'var(--color-ink)' }}
            >
              Fork Kit
            </h2>
            <p
              className="mb-4"
              style={{ ...handAlt, fontSize: 15, color: 'var(--color-pencil)' }}
            >
              {forkTarget.description}
            </p>
            <label
              className="block mb-1"
              style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
            >
              Kit 名称
            </label>
            <input
              value={forkName}
              onChange={(e) => setForkName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFork()}
              className="w-full border-none outline-none bg-transparent mb-5"
              style={{
                borderBottom: '1.5px solid var(--color-pencil)',
                padding: '6px 2px',
                ...handFont,
                fontSize: 20,
                color: 'var(--color-blue-pen)'
              }}
            />
            <button
              onClick={handleFork}
              disabled={forking}
              className="w-full py-2.5 rounded-md border-none cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              style={{
                ...handFont,
                fontSize: 18,
                background: 'var(--color-blue-pen)',
                color: '#fff'
              }}
            >
              {forking ? 'Forking...' : 'Fork to My Space'}
            </button>
          </>
        )}
      </Modal>

      {/* ─── Publish 侧边抽屉 ─── */}
      {showPublish && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center"
          onClick={() => setShowPublish(false)}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(42,42,42,0.25)' }}
          />
          <div
            className="sticky-note tape-top relative w-full max-w-[680px] max-h-[85vh] overflow-y-auto"
            style={{
              background: '#FFF9C4',
              border: '2.5px solid rgba(45,45,45,0.12)',
              borderRadius: '18px 22px 20px 16px',
              boxShadow:
                '6px 6px 0 rgba(45,45,45,0.08), 0 12px 40px rgba(0,0,0,0.1)',
              transform: 'rotate(-0.5deg)',
              animation: 'fadeIn 0.2s ease-out',
              margin: '0 24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tape" />
            <div style={{ padding: '36px 40px 32px' }}>
              {/* 标题栏 */}
              <div className="flex items-center justify-between mb-10">
                <h2
                  className="text-[28px] font-bold"
                  style={{
                    ...handFont,
                    color: 'var(--color-ink)',
                    transform: 'rotate(-1deg)'
                  }}
                >
                  发布 Kit
                </h2>
                <button
                  onClick={() => setShowPublish(false)}
                  className="bg-transparent border-none cursor-pointer p-2 rounded-full hover:scale-110 transition-transform"
                  style={{ color: 'var(--color-pencil)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-12">
                {/* 左列：基本信息 */}
                <section>
                  <h3
                    className="text-[17px] font-semibold mb-5 pb-2"
                    style={{
                      ...handFont,
                      color: 'var(--color-blue-pen)',
                      borderBottom: '1.5px dashed rgba(58,107,197,0.2)'
                    }}
                  >
                    基本信息
                  </h3>

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    选择 Space
                  </label>
                  <div className="relative mb-6">
                    <select
                      value={pubSpaceId}
                      onChange={(e) => {
                        setPubSpaceId(e.target.value)
                        const sp = spaces.find((s) => s.id === e.target.value)
                        if (sp && !pubLabel) setPubLabel(sp.label)
                      }}
                      className="w-full bg-transparent outline-none cursor-pointer appearance-none"
                      style={{
                        borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                        padding: '10px 24px 10px 2px',
                        ...handFont,
                        fontSize: 17,
                        color: 'var(--color-ink)'
                      }}
                    >
                      {spaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-pencil)' }}
                    />
                  </div>

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    标题
                  </label>
                  <input
                    value={pubLabel}
                    onChange={(e) => setPubLabel(e.target.value)}
                    placeholder="Kit 标题（必填）"
                    className="w-full border-none outline-none bg-transparent mb-6"
                    style={{
                      borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                      padding: '10px 2px',
                      ...handFont,
                      fontSize: 17,
                      color: 'var(--color-blue-pen)'
                    }}
                  />

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    描述
                  </label>
                  <textarea
                    value={pubDesc}
                    onChange={(e) => setPubDesc(e.target.value)}
                    placeholder="简单介绍你的 Kit..."
                    rows={3}
                    className="w-full border-none outline-none bg-transparent mb-6 resize-none"
                    style={{
                      borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                      padding: '10px 2px',
                      ...handAlt,
                      fontSize: 15,
                      color: 'var(--color-ink)',
                      lineHeight: 1.6
                    }}
                  />

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    标签（逗号分隔）
                  </label>
                  <input
                    value={pubTags}
                    onChange={(e) => setPubTags(e.target.value)}
                    placeholder="AUTO, 产品, 工程"
                    className="w-full border-none outline-none bg-transparent"
                    style={{
                      borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                      padding: '10px 2px',
                      ...handFont,
                      fontSize: 15,
                      color: 'var(--color-ink)'
                    }}
                  />
                </section>

                {/* 右列：模型配置 */}
                <section>
                  <h3
                    className="text-[17px] font-semibold mb-5 pb-2"
                    style={{
                      ...handFont,
                      color: 'var(--color-blue-pen)',
                      borderBottom: '1.5px dashed rgba(58,107,197,0.2)'
                    }}
                  >
                    模型配置
                  </h3>

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    模型
                  </label>
                  <div className="relative mb-6">
                    <select
                      value={pubModel}
                      onChange={(e) => setPubModel(e.target.value)}
                      className="w-full bg-transparent outline-none cursor-pointer appearance-none"
                      style={{
                        borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                        padding: '10px 24px 10px 2px',
                        ...handFont,
                        fontSize: 15,
                        color: 'var(--color-ink)'
                      }}
                    >
                      <option value="claude-sonnet-4-6">
                        Claude Sonnet 4.6
                      </option>
                      <option value="claude-opus-4-6">Claude Opus 4.6</option>
                      <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-pencil)' }}
                    />
                  </div>

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    可见性
                  </label>
                  <div className="flex gap-3 mb-6">
                    {(['public', 'unlisted'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setPubVisibility(v)}
                        className="flex-1 py-2.5 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          ...handFont,
                          fontSize: 15,
                          borderColor:
                            pubVisibility === v
                              ? 'var(--color-blue-pen)'
                              : 'rgba(42,42,42,0.1)',
                          background:
                            pubVisibility === v
                              ? 'rgba(58,107,197,0.08)'
                              : 'transparent',
                          color:
                            pubVisibility === v
                              ? 'var(--color-blue-pen)'
                              : 'var(--color-pencil)'
                        }}
                      >
                        {v === 'public' ? '公开' : '不公开'}
                      </button>
                    ))}
                  </div>

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    System Prompt
                  </label>
                  <textarea
                    value={pubSystemPrompt}
                    onChange={(e) => setPubSystemPrompt(e.target.value)}
                    placeholder="Agent 行为指令..."
                    rows={3}
                    className="w-full border-none outline-none bg-transparent mb-6 resize-none"
                    style={{
                      borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                      padding: '10px 2px',
                      ...handSm,
                      fontSize: 14,
                      color: 'var(--color-ink)',
                      lineHeight: 1.6
                    }}
                  />

                  <div className="flex items-center gap-3 mb-6">
                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      style={{
                        ...handFont,
                        fontSize: 15,
                        color: 'var(--color-ink)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={pubAllowFork}
                        onChange={(e) => setPubAllowFork(e.target.checked)}
                        className="cursor-pointer"
                      />
                      允许他人 Fork
                    </label>
                  </div>

                  <label
                    className="block mb-2"
                    style={{
                      ...handSm,
                      fontSize: 13,
                      color: 'var(--color-pencil)'
                    }}
                  >
                    最大分裂深度
                  </label>
                  <input
                    type="number"
                    value={pubMaxDepth}
                    onChange={(e) => setPubMaxDepth(e.target.value)}
                    min={1}
                    max={20}
                    className="w-24 border-none outline-none bg-transparent"
                    style={{
                      borderBottom: '1.5px solid rgba(42,42,42,0.15)',
                      padding: '8px 2px',
                      ...handFont,
                      fontSize: 16,
                      color: 'var(--color-ink)'
                    }}
                  />
                </section>
              </div>

              {/* 发布按钮 */}
              <div
                style={{
                  marginTop: 32,
                  paddingTop: 20,
                  borderTop: '1.5px dashed rgba(42,42,42,0.1)'
                }}
              >
                <button
                  onClick={handlePublish}
                  disabled={!pubSpaceId || !pubLabel.trim() || publishing}
                  className="w-full py-3.5 rounded-lg border-none cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
                  style={{
                    ...handFont,
                    fontSize: 20,
                    background: 'var(--color-blue-pen)',
                    color: '#fff'
                  }}
                >
                  {publishing ? '发布中...' : '发布'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 右键菜单 ─── */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          onRename={async () => {
            const name = prompt('新名称:', ctxMenu.space.label)
            if (name?.trim()) {
              await updateSpace(ctxMenu.space.id, { label: name.trim() })
              refreshSpaces()
            }
          }}
          onDelete={() => handleDelete(ctxMenu.space.id)}
          onDuplicate={async () => {
            try {
              await createSpace({
                label: ctxMenu.space.label + ' (副本)',
                emoji: ctxMenu.space.emoji,
                color: ctxMenu.space.color,
                mode: ctxMenu.space.mode,
                description: ctxMenu.space.description
              })
              refreshSpaces()
            } catch {
              alert('复制失败')
            }
          }}
          onPublish={() => {
            setTab('workshop')
            setPubSpaceId(ctxMenu.space.id)
            setPubLabel(ctxMenu.space.label)
            setPubDesc(ctxMenu.space.description)
            setShowPublish(true)
          }}
        />
      )}
    </div>
  )
}
