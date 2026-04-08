import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, GitFork, Upload, X } from 'lucide-react'
import {
  listSpaces,
  createSpace,
  deleteSpace,
  listMarketKits,
  forkMarketKit,
  listPublished,
  publishSpace,
  type Space,
  type MarketKit,
  type PublishedKit
} from '../lib/api'

type Tab = 'spaces' | 'market' | 'workshop'

/* ─── 极简弹窗 ─── */
function Modal({
  open,
  onClose,
  children
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(42,42,42,0.25)' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-lg"
        style={{
          background: 'var(--color-paper)',
          border: '1.5px solid var(--color-ink)',
          padding: '28px 32px',
          boxShadow: '4px 4px 20px rgba(0,0,0,0.08)',
          transform: 'rotate(-0.3deg)'
        }}
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

export function Home() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('spaces')
  const [spaces, setSpaces] = useState<Space[]>([])
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
  const [publishing, setPublishing] = useState(false)

  const refreshSpaces = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSpaces()
      setSpaces(data.spaces || [])
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshSpaces()
  }, [refreshSpaces])

  // 切换 tab 时加载对应数据
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

  const handleCreate = async () => {
    const label = prompt('Space name:')
    if (!label?.trim()) return
    try {
      const { space } = await createSpace({ label: label.trim() })
      navigate(`/space/${space.id}?new`)
    } catch {
      alert('Failed to create space')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this space?')) return
    try {
      await deleteSpace(id)
      refreshSpaces()
    } catch {
      alert('Failed to delete')
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
      navigate(`/space/${space.id}?new`)
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
    { key: 'spaces', label: 'My Space' },
    { key: 'market', label: '广场' },
    { key: 'workshop', label: '工坊' }
  ]

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handAlt = { fontFamily: 'var(--font-hand-alt)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'var(--color-paper)' }}
    >
      {/* 顶部导航 */}
      <nav
        className="flex items-center gap-8 px-10 pt-8 pb-4"
        style={{ ...handFont, fontSize: 26 }}
      >
        <span
          className="text-[36px] font-bold mr-4"
          style={{
            color: 'var(--color-ink)',
            transform: 'rotate(-2deg)',
            display: 'inline-block'
          }}
        >
          MindKit
        </span>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="bg-transparent border-none cursor-pointer pb-1 transition-all"
            style={{
              color:
                tab === t.key ? 'var(--color-blue-pen)' : 'var(--color-pencil)',
              borderBottom:
                tab === t.key
                  ? '2px solid var(--color-blue-pen)'
                  : '2px solid transparent',
              ...handFont,
              fontSize: 24
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ─── My Space ─── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center py-8">
        {tab === 'spaces' && (
          <div className="w-full max-w-3xl px-6">
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
              }}
            >
              <button
                onClick={handleCreate}
                className="flex flex-col items-center justify-center gap-3 p-10 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  border: '2px dashed var(--color-pencil)',
                  background: 'transparent',
                  color: 'var(--color-pencil)',
                  ...handFont,
                  fontSize: 22,
                  minHeight: 200
                }}
              >
                <Plus size={36} strokeWidth={1.5} />
                new space
              </button>
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
              {spaces.map((space) => (
                <div
                  key={space.id}
                  onClick={() => navigate(`/space/${space.id}`)}
                  className="relative p-8 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] group"
                  style={{
                    border: '1.5px solid var(--color-ink)',
                    background: 'var(--color-paper)',
                    boxShadow: '2px 3px 8px rgba(0,0,0,0.05)',
                    minHeight: 200
                  }}
                >
                  <h3
                    className="text-[26px] font-semibold mb-2"
                    style={{ ...handFont, color: 'var(--color-blue-pen)' }}
                  >
                    {space.label}
                  </h3>
                  {space.description && (
                    <p
                      className="mb-3 line-clamp-2"
                      style={{
                        ...handAlt,
                        fontSize: 14,
                        color: 'var(--color-ink)',
                        lineHeight: 1.6
                      }}
                    >
                      {space.description}
                    </p>
                  )}
                  <p
                    style={{
                      ...handSm,
                      color: 'var(--color-pencil)',
                      fontSize: 13
                    }}
                  >
                    {new Date(space.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={(e) => handleDelete(space.id, e)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-60 transition-opacity bg-transparent border-none cursor-pointer p-1"
                    style={{ color: 'var(--color-red-pen)' }}
                  >
                    <Trash2 size={18} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
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
              {marketKits.map((kit) => (
                <div
                  key={kit.id}
                  className="p-6 rounded-lg transition-transform hover:scale-[1.01] flex flex-col overflow-hidden"
                  style={{
                    border: '1.5px solid var(--color-ink)',
                    background: 'var(--color-paper)',
                    boxShadow: '2px 3px 8px rgba(0,0,0,0.05)',
                    minHeight: 200
                  }}
                >
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
                                : 'rgba(201,74,74,0.1)',
                            color:
                              tag === 'AUTO'
                                ? 'var(--color-blue-pen)'
                                : 'var(--color-red-pen)',
                            border: `1px solid ${tag === 'AUTO' ? 'rgba(58,107,197,0.2)' : 'rgba(201,74,74,0.2)'}`
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
                      fontSize: 14,
                      color: 'var(--color-ink)',
                      lineHeight: 1.5
                    }}
                  >
                    {kit.description}
                  </p>
                  <div
                    className="flex flex-col gap-3 mt-auto pt-2"
                    style={{ borderTop: '1px solid rgba(42,42,42,0.08)' }}
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
              ))}
            </div>
          </div>
        )}

        {/* ─── Kit 工坊 ─── */}
        {tab === 'workshop' && (
          <div className="w-full max-w-3xl px-6 mx-auto">
            <button
              onClick={openPublish}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] border-none mb-6"
              style={{
                ...handFont,
                fontSize: 18,
                background: 'var(--color-blue-pen)',
                color: '#fff'
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
              <div className="flex flex-col gap-3">
                {published.map((kit) => (
                  <div
                    key={kit.id}
                    className="flex items-center gap-6 p-5 rounded-lg"
                    style={{
                      border: '1.5px solid var(--color-ink)',
                      background: 'var(--color-paper)',
                      boxShadow: '2px 3px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-[18px] font-semibold mb-1"
                        style={{ ...handFont, color: 'var(--color-blue-pen)' }}
                      >
                        {kit.label}
                      </h3>
                      <p
                        className="truncate"
                        style={{
                          ...handAlt,
                          fontSize: 14,
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* ─── Publish 弹窗 ─── */}
      <Modal open={showPublish} onClose={() => setShowPublish(false)}>
        <h2
          className="text-[24px] font-bold mb-4"
          style={{ ...handFont, color: 'var(--color-ink)' }}
        >
          发布 Kit
        </h2>
        <label
          className="block mb-1"
          style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
        >
          选择 Space
        </label>
        <select
          value={pubSpaceId}
          onChange={(e) => {
            setPubSpaceId(e.target.value)
            const sp = spaces.find((s) => s.id === e.target.value)
            if (sp && !pubLabel) setPubLabel(sp.label)
          }}
          className="w-full bg-transparent outline-none mb-4 cursor-pointer"
          style={{
            borderBottom: '1.5px solid var(--color-pencil)',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomWidth: '1.5px',
            borderBottomColor: 'var(--color-pencil)',
            padding: '6px 2px',
            ...handFont,
            fontSize: 18,
            color: 'var(--color-ink)'
          }}
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <label
          className="block mb-1"
          style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
        >
          标题
        </label>
        <input
          value={pubLabel}
          onChange={(e) => setPubLabel(e.target.value)}
          placeholder="Kit 标题"
          className="w-full border-none outline-none bg-transparent mb-4"
          style={{
            borderBottom: '1.5px solid var(--color-pencil)',
            padding: '6px 2px',
            ...handFont,
            fontSize: 18,
            color: 'var(--color-blue-pen)'
          }}
        />

        <label
          className="block mb-1"
          style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
        >
          描述
        </label>
        <textarea
          value={pubDesc}
          onChange={(e) => setPubDesc(e.target.value)}
          placeholder="简单介绍你的 Kit..."
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

        <label
          className="block mb-1"
          style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}
        >
          标签（逗号分隔）
        </label>
        <input
          value={pubTags}
          onChange={(e) => setPubTags(e.target.value)}
          placeholder="AUTO, 产品"
          className="w-full border-none outline-none bg-transparent mb-5"
          style={{
            borderBottom: '1.5px solid var(--color-pencil)',
            padding: '6px 2px',
            ...handFont,
            fontSize: 16,
            color: 'var(--color-ink)'
          }}
        />

        <button
          onClick={handlePublish}
          disabled={publishing || !pubLabel.trim() || !pubSpaceId}
          className="w-full py-2.5 rounded-md border-none cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          style={{
            ...handFont,
            fontSize: 18,
            background: 'var(--color-blue-pen)',
            color: '#fff'
          }}
        >
          {publishing ? '发布中...' : '确认发布'}
        </button>
      </Modal>
    </div>
  )
}
