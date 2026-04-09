import { useRef, useEffect, useState, useCallback } from 'react'
import {
  wobblyLine,
  scribbleNode,
  computeLayout,
  type LayoutNode
} from '../lib/doodle'
import { getSessionL2, type SessionTreeNode } from '../lib/api'

interface TopoCanvasProps {
  spaceId: string
  tree: SessionTreeNode[]
  activeNodeId?: string | null
  onNodeClick?: (id: string) => void
}

export function TopoCanvas({
  spaceId,
  tree,
  activeNodeId,
  onNodeClick
}: TopoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<LayoutNode[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    label: string
    l2: string | null
  } | null>(null)
  const l2Cache = useRef<Map<string, string | null>>(new Map())
  // 新节点动画追踪
  const knownNodeIds = useRef<Set<string>>(new Set())
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set())

  // 画布平移状态
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)

  // 构建 turnCount 映射（用于亮度渲染）
  const turnCountMap = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const map = new Map<string, number>()
    const walk = (nodes: SessionTreeNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n.turnCount)
        walk(n.children)
      }
    }
    walk(tree)
    turnCountMap.current = map
  }, [tree])

  // 重新计算布局（tree 变化或容器尺寸变化时）
  const reLayout = useCallback(() => {
    const el = containerRef.current
    if (!el || tree.length === 0) return
    const { width, height } = el.getBoundingClientRect()
    if (width === 0 || height === 0) return
    const layout = computeLayout(tree, width, height)
    setNodes(layout)
    setPan({ x: 0, y: 0 })

    // 检测新节点
    const currentIds = new Set(layout.map((n) => n.id))
    const fresh = new Set<string>()
    for (const id of currentIds) {
      if (!knownNodeIds.current.has(id)) fresh.add(id)
    }
    knownNodeIds.current = currentIds
    if (fresh.size > 0) {
      setNewNodeIds(fresh)
      // 动画结束后清除
      setTimeout(() => setNewNodeIds(new Set()), 600)
    }
  }, [tree])

  useEffect(() => {
    reLayout()
  }, [reLayout])

  // 监听容器尺寸变化（抽屉展开/收起时触发）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => reLayout())
    ro.observe(el)
    return () => ro.disconnect()
  }, [reLayout])

  // 屏幕坐标 → 画布坐标
  const toCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return { x: screenX - pan.x, y: screenY - pan.y }
    },
    [pan]
  )

  // 渲染 Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.parentElement!.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // 应用平移
    ctx.save()
    ctx.translate(pan.x, pan.y)

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    // 绘制实线：parent-child 直接关联
    for (const node of nodes) {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId)
        if (parent) {
          ctx.save()
          ctx.strokeStyle = 'rgba(34,34,34,0.35)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([])
          wobblyLine(ctx, parent.x, parent.y, node.x, node.y, 1.5)
          ctx.restore()
        }
      }
    }

    // 绘制虚曲线：sourceSessionId 跨分支引用（L1 全局意识）
    for (const node of nodes) {
      if (node.sourceSessionId && node.sourceSessionId !== node.parentId) {
        const source = nodeMap.get(node.sourceSessionId)
        if (source) {
          ctx.save()
          ctx.strokeStyle = 'rgba(58,107,197,0.3)'
          ctx.lineWidth = 1
          ctx.setLineDash([6, 4])
          // 用贝塞尔曲线代替直线，控制点偏移到垂直方向
          const mx = (source.x + node.x) / 2
          const my = (source.y + node.y) / 2
          const dx = node.x - source.x
          const dy = node.y - source.y
          const len = Math.sqrt(dx * dx + dy * dy)
          // 垂直方向偏移，弧度随距离缩放
          const offset = Math.min(len * 0.7, 200)
          const nx = -dy / (len || 1)
          const ny = dx / (len || 1)
          const cpx = mx + nx * offset
          const cpy = my + ny * offset
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.quadraticCurveTo(cpx, cpy, node.x, node.y)
          ctx.stroke()
          ctx.setLineDash([])
          // L1 标签放在曲线中点（即控制点与中点的中间）
          const labelX = (mx + cpx) / 2
          const labelY = (my + cpy) / 2
          ctx.font = '11px "Coming Soon", cursive'
          ctx.fillStyle = 'rgba(58,107,197,0.4)'
          ctx.textAlign = 'center'
          ctx.fillText('L1', labelX, labelY - 4)
          ctx.restore()
        }
      }
    }

    // 绘制节点（核心节点更大更醒目，inactive 节点半透明，亮度映射活跃度）
    for (const node of nodes) {
      const isActive = activeNodeId === node.id
      const isHovered = hoveredId === node.id
      const isInactive = node.activationStatus === 'inactive'
      // 亮度映射：turnCount 越高越亮（0.5 ~ 1.0 范围）
      const tc = turnCountMap.current.get(node.id) || 0
      const activityAlpha = Math.min(1, 0.5 + tc * 0.1)
      const baseAlpha = isInactive
        ? 0.3
        : isActive || isHovered
          ? 1
          : activityAlpha
      const nodeColor = isInactive ? '#999999' : node.color
      scribbleNode(
        ctx,
        node.x,
        node.y,
        node.r,
        nodeColor,
        baseAlpha,
        isActive || isHovered
      )
    }

    // 绘制标签
    for (const node of nodes) {
      const isActive = activeNodeId === node.id
      const isCore = !node.parentId
      const isInactive = node.activationStatus === 'inactive'
      ctx.font = isCore ? '18px "Caveat", cursive' : '14px "Caveat", cursive'
      ctx.textAlign = 'center'
      ctx.fillStyle = isInactive
        ? 'rgba(34,34,34,0.2)'
        : isActive || hoveredId === node.id
          ? node.color
          : isCore
            ? 'rgba(34,34,34,0.7)'
            : 'rgba(34,34,34,0.5)'
      ctx.fillText(
        node.label || node.id.slice(0, 6),
        node.x,
        node.y + node.r + (isCore ? 22 : 16)
      )
    }

    ctx.restore() // 恢复平移
  }, [nodes, hoveredId, activeNodeId, pan])

  useEffect(() => {
    render()
  }, [render])

  // hover 时获取 L2
  const fetchL2 = useCallback(
    async (nodeId: string) => {
      if (l2Cache.current.has(nodeId)) return l2Cache.current.get(nodeId)!
      try {
        const { content } = await getSessionL2(spaceId, nodeId)
        l2Cache.current.set(nodeId, content)
        return content
      } catch {
        l2Cache.current.set(nodeId, null)
        return null
      }
    },
    [spaceId]
  )

  // 命中检测
  const hitTest = useCallback(
    (screenX: number, screenY: number): LayoutNode | null => {
      const { x: cx, y: cy } = toCanvas(screenX, screenY)
      for (const node of nodes) {
        const dx = cx - node.x,
          dy = cy - node.y
        if (dx * dx + dy * dy < (node.r + 6) ** 2) return node
      }
      return null
    },
    [nodes, toCanvas]
  )

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    hasDragged.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }

  // 拖拽中 + hover
  const handleMouseMove = async (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (dragging.current) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy })
      setTooltip(null)
      return
    }

    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const found = hitTest(mx, my)

    if (found) {
      setHoveredId(found.id)
      const l2 = await fetchL2(found.id)
      setTooltip({ x: mx + 12, y: my - 8, label: found.label || found.id, l2 })
    } else {
      setHoveredId(null)
      setTooltip(null)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const wasDragging = hasDragged.current
    dragging.current = false
    hasDragged.current = false
    if (wasDragging) return

    // 没有拖拽才触发点击
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const found = hitTest(mx, my)
    if (found) onNodeClick?.(found.id)
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{
        background: `
          var(--color-paper)
          repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(180,200,230,0.12) 31px, rgba(180,200,230,0.12) 32px),
          repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(180,200,230,0.12) 31px, rgba(180,200,230,0.12) 32px)
        `,
        backgroundSize: 'auto, 32px 32px, 32px 32px'
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          dragging.current = false
          setHoveredId(null)
          setTooltip(null)
        }}
        style={{
          cursor: dragging.current ? 'grabbing' : hoveredId ? 'pointer' : 'grab'
        }}
      />

      {/* 新节点分裂动画 */}
      {Array.from(newNodeIds).map((id) => {
        const node = nodes.find((n) => n.id === id)
        if (!node) return null
        return (
          <div
            key={`anim-${id}`}
            className="absolute pointer-events-none z-10"
            style={{
              left: node.x + pan.x - 24,
              top: node.y + pan.y - 24,
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `2px solid ${node.color}`,
              animation: 'nodeSpawn 0.6s ease-out forwards'
            }}
          />
        )
      })}

      {/* 标题 */}
      <div
        className="absolute top-5 left-6 z-10 pointer-events-none"
        style={{ transform: 'rotate(-2deg)' }}
      >
        <h1
          className="text-[32px] font-bold relative"
          style={{ fontFamily: 'var(--font-hand)', color: 'var(--color-ink)' }}
        >
          Idea Map
          <span
            className="absolute inset-[-8px_-14px]"
            style={{
              border: '2px solid var(--color-red-pen)',
              borderRadius: '55% 45% 50% 50% / 45% 55% 45% 55%',
              opacity: 0.3,
              transform: 'rotate(2deg)'
            }}
          />
        </h1>
      </div>

      {/* 图例 */}
      <div
        className="absolute bottom-5 left-6 z-10 pointer-events-none"
        style={{
          fontFamily: 'var(--font-hand-sm)',
          fontSize: 13,
          color: 'var(--color-pencil)',
          lineHeight: 2,
          transform: 'rotate(1deg)'
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-[2px] rounded-sm"
            style={{ background: 'rgba(34,34,34,0.35)' }}
          />
          direct (parent → child)
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-0 border-t-[1.5px] border-dashed"
            style={{ borderColor: 'rgba(58,107,197,0.4)', width: 24 }}
          />
          L1 awareness
        </div>
      </div>

      {/* 模板进度 */}
      {nodes.some((n) => n.activationStatus) &&
        (() => {
          const total = nodes.filter(
            (n) =>
              n.activationStatus === 'activated' ||
              n.activationStatus === 'inactive'
          ).length
          const activated = nodes.filter(
            (n) => n.activationStatus === 'activated'
          ).length
          const done = total > 0 && activated >= total
          return (
            <div
              className="absolute top-5 right-6 z-10 pointer-events-none"
              style={{
                fontFamily: 'var(--font-hand-sm)',
                fontSize: 14,
                color: 'var(--color-pencil)'
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    color: done
                      ? 'var(--color-green-hl)'
                      : 'var(--color-blue-pen)',
                    fontWeight: 600
                  }}
                >
                  {activated} / {total}
                </span>
                <span>节点已完成</span>
              </div>
              {done && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-green-hl)',
                    marginTop: 2
                  }}
                >
                  ✓ 已完成基础流程
                </div>
              )}
            </div>
          )
        })()}

      {/* Tooltip with L2 */}
      {tooltip && (
        <div
          className="absolute z-50 max-w-[300px] rounded-md pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            background: 'var(--color-paper)',
            border: '1.5px solid var(--color-ink)',
            padding: '10px 14px',
            boxShadow: '2px 2px 8px rgba(34,34,34,0.06)',
            transform: 'rotate(-0.3deg)'
          }}
        >
          <div
            className="font-bold mb-1"
            style={{
              fontFamily: 'var(--font-hand)',
              fontSize: 18,
              color: 'var(--color-blue-pen)'
            }}
          >
            {tooltip.label}
          </div>
          {tooltip.l2 ? (
            <div
              style={{
                fontFamily: 'var(--font-hand-alt)',
                fontSize: 14,
                color: 'var(--color-ink)',
                lineHeight: 1.4
              }}
            >
              {tooltip.l2}
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--font-hand-sm)',
                fontSize: 12,
                color: 'var(--color-pencil)'
              }}
            >
              no L2 yet
            </div>
          )}
        </div>
      )}

      {/* 风格标签 */}
      <div
        className="absolute bottom-5 right-6 z-10 pointer-events-none"
        style={{
          fontFamily: 'var(--font-hand-sm)',
          fontSize: 12,
          color: 'rgba(34,34,34,0.15)'
        }}
      >
        MindKit — clean doodle
      </div>
    </div>
  )
}
