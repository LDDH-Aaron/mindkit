import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchTopology, fetchSpaces } from '@/lib/api'
import { ChatPanel } from '@/components/ChatPanel'
import { TopologyCanvas } from '@/components/TopologyCanvas'
import { SessionDetailPanel } from '@/components/SessionDetailPanel'
import type { SessionTreeNode, TopoNode, SpaceMeta, WsMessage } from '@/lib/types'

/** 递归树 → 扁平节点数组 */
function flattenTree(node: SessionTreeNode, parentId: string | null): TopoNode[] {
  const flat: TopoNode = {
    id: node.id,
    label: node.label,
    parentId,
    status: node.status,
    turns: node.turnCount,
    children: node.children.map((c) => c.id),
  }
  return [flat, ...node.children.flatMap((c) => flattenTree(c, node.id))]
}

/** Kit 工作界面 — 左侧对话 + 右侧拓扑图 */
export function KitWorkspace() {
  const { id: spaceId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [nodes, setNodes] = useState<TopoNode[]>([])
  const [spaceMeta, setSpaceMeta] = useState<SpaceMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null)

  /** 拉取拓扑并扁平化 */
  const refreshTopology = useCallback(async () => {
    if (!spaceId) return
    try {
      const tree = await fetchTopology(spaceId)
      const flat = flattenTree(tree, null)
      setNodes(flat)
      // 首次加载默认选中主节点
      setSelectedNodeId((prev) => prev ?? flat.find((n) => n.parentId === null)?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '拓扑加载失败')
    }
  }, [spaceId])

  /** 初始加载 — 并行拉取 space 元数据 + 拓扑 */
  useEffect(() => {
    if (!spaceId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [spaces, tree] = await Promise.all([
          fetchSpaces(),
          fetchTopology(spaceId!),
        ])
        if (cancelled) return

        const meta = spaces.find((s) => s.id === spaceId) ?? null
        setSpaceMeta(meta)

        const flat = flattenTree(tree, null)
        setNodes(flat)
        setSelectedNodeId(flat.find((n) => n.parentId === null)?.id ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [spaceId])

  /** WS 连接 — 监听 node_forked 事件刷新拓扑 */
  useEffect(() => {
    if (!spaceId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/spaces/${spaceId}`)

    ws.addEventListener('message', (evt) => {
      try {
        const msg: WsMessage = JSON.parse(evt.data as string)
        if (msg.type === 'space_event' && msg.event.kind === 'node_forked') {
          refreshTopology()
        }
      } catch {
        // 忽略非 JSON 消息
      }
    })

    return () => { ws.close() }
  }, [spaceId, refreshTopology])

  const activeNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  if (!spaceId) {
    return (
      <div className="h-screen flex items-center justify-center text-text-muted">
        <div className="text-center">
          <p>空间不存在</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm mt-2 hover:underline">
            返回列表
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-text-muted">
        <p className="text-sm">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-text-muted">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm mt-2 hover:underline">
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/* 顶栏 */}
      <div className="h-12 px-4 flex items-center border-b border-border bg-card shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors mr-4"
        >
          <ArrowLeft size={16} />
          返回 Space
        </button>
        <h2 className="font-semibold text-sm">{spaceMeta?.name ?? spaceId}</h2>
        {spaceMeta?.mode && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium ml-2">
            {spaceMeta.mode}
          </span>
        )}
      </div>

      {/* 主内容区 — 左右对半 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：对话面板 */}
        <div className="w-1/2 border-r border-border">
          <ChatPanel
            spaceId={spaceId}
            sessionId={activeNode?.id ?? null}
            sessionLabel={activeNode?.label ?? ''}
            onTurnComplete={refreshTopology}
          />
        </div>

        {/* 右侧：拓扑图 + 详情面板 */}
        <div className="w-1/2 relative">
          <TopologyCanvas
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            onNodeDetail={setDetailSessionId}
          />
          {detailSessionId && spaceId && (
            <SessionDetailPanel
              spaceId={spaceId}
              sessionId={detailSessionId}
              onClose={() => setDetailSessionId(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
