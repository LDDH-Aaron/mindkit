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
  /** 受控缩放值 */
  zoom?: number
  /** 缩放变更回调 */
  onZoomChange?: (z: number) => void
  /** 平滑聚焦到某节点（变化时触发动画） */
  focusNodeId?: string | null
}

export function TopoCanvas({
  spaceId,
  tree,
  activeNodeId,
  onNodeClick,
  zoom: controlledZoom,
  onZoomChange,
  focusNodeId
}: TopoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<LayoutNode[]>([])
  const targetNodes = useRef<LayoutNode[]>([])
  const animatingRef = useRef(false)
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
  const [localZoom, setLocalZoom] = useState(1)
  const isZoomControlled = controlledZoom !== undefined
  const zoom = isZoomControlled ? controlledZoom : localZoom
  const setZoom = isZoomControlled
    ? (v: number | ((prev: number) => number)) => {
        const next = typeof v === 'function' ? v(zoom) : v
        onZoomChange?.(next)
      }
    : setLocalZoom
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

  // 位置插值动画
  const startAnimation = useCallback(() => {
    if (animatingRef.current) return
    animatingRef.current = true
    const duration = 500 // ms
    const startTime = performance.now()
    // 快照当前位置
    const startPos = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]))

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3)
      const targets = targetNodes.current
      const interpolated = targets.map((target) => {
        const start = startPos.get(target.id)
        if (!start) {
          // 新节点：从父节点位置滑出
          const parent = targets.find((n) => n.id === target.parentId)
          const fromX = parent ? (startPos.get(parent.id)?.x ?? parent.x) : target.x
          const fromY = parent ? (startPos.get(parent.id)?.y ?? parent.y) : target.y
          return {
            ...target,
            x: fromX + (target.x - fromX) * ease,
            y: fromY + (target.y - fromY) * ease
          }
        }
        return {
          ...target,
          x: start.x + (target.x - start.x) * ease,
          y: start.y + (target.y - start.y) * ease
        }
      })
      setNodes(interpolated)
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        animatingRef.current = false
      }
    }
    requestAnimationFrame(tick)
  }, [nodes])

  const startAnimationRef = useRef(startAnimation)
  startAnimationRef.current = startAnimation

  // 重新计算布局（tree 变化或容器尺寸变化时）
  const reLayout = useCallback(() => {
    const el = containerRef.current
    if (!el || tree.length === 0) return
    const { width, height } = el.getBoundingClientRect()
    if (width === 0 || height === 0) return
    const layout = computeLayout(tree, width, height)
    targetNodes.current = layout

    const isFirst = knownNodeIds.current.size === 0
    if (isFirst) {
      // 首次：直接设置位置，重置视角
      setNodes(layout)
      setPan({ x: 0, y: 0 })
      setZoom(1)
    } else {
      // 后续：启动过渡动画
      startAnimationRef.current()
    }

    // 检测新节点
    const currentIds = new Set(layout.map((n) => n.id))
    const fresh = new Set<string>()
    for (const id of currentIds) {
      if (!knownNodeIds.current.has(id)) fresh.add(id)
    }
    knownNodeIds.current = currentIds
    if (fresh.size > 0) {
      setNewNodeIds(fresh)
      // 动画结束后移交 Canvas（线 1s + 标签 0.5s）
      setTimeout(() => setNewNodeIds(new Set()), 1500)
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

  // 平滑聚焦到指定节点（将其移动到视口中心）
  const prevFocusRef = useRef<string | null>(null)
  useEffect(() => {
    if (!focusNodeId || focusNodeId === prevFocusRef.current) return
    prevFocusRef.current = focusNodeId
    const node = nodes.find((n) => n.id === focusNodeId)
    const el = containerRef.current
    if (!node || !el) return
    const { width, height } = el.getBoundingClientRect()
    // 目标 pan：让节点在视口中心
    const targetPan = {
      x: width / 2 - node.x * zoom,
      y: height / 2 - node.y * zoom
    }
    // 动画插值
    const startPan = { ...pan }
    const duration = 600
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setPan({
        x: startPan.x + (targetPan.x - startPan.x) * ease,
        y: startPan.y + (targetPan.y - startPan.y) * ease
      })
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNodeId, nodes.length])

  // 屏幕坐标 → 画布坐标
  const toCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return { x: (screenX - pan.x) / zoom, y: (screenY - pan.y) / zoom }
    },
    [pan, zoom]
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

    // 应用平移和缩放
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    // 绘制实线：parent-child 直接关联（跳过正在动画的新节点）
    // 连线在节点边缘截断，不穿过节点中心
    for (const node of nodes) {
      if (newNodeIds.has(node.id)) continue
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId)
        if (parent) {
          const dx = node.x - parent.x
          const dy = node.y - parent.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < (parent.r + node.r + 4)) continue // 太近就不画
          const ux = dx / dist, uy = dy / dist
          const x1 = parent.x + ux * (parent.r + 4)
          const y1 = parent.y + uy * (parent.r + 4)
          const x2 = node.x - ux * (node.r + 4)
          const y2 = node.y - uy * (node.r + 4)
          ctx.save()
          ctx.strokeStyle = 'rgba(34,34,34,0.35)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([])
          wobblyLine(ctx, x1, y1, x2, y2, 1.5)
          ctx.restore()
        }
      }
    }

    // 绘制跨分支虚曲线（蓝色=关联，红色=矛盾）
    // 起止点在节点边缘截断
    const crossLinks: { sourceId: string; targetNode: typeof nodes[0]; type: 'relate' | 'conflict' }[] = []
    for (const node of nodes) {
      if (node.sourceSessionId && node.sourceSessionId !== node.parentId) {
        crossLinks.push({ sourceId: node.sourceSessionId, targetNode: node, type: 'relate' })
      }
      if (node.conflictSessionId && node.conflictSessionId !== node.parentId) {
        crossLinks.push({ sourceId: node.conflictSessionId, targetNode: node, type: 'conflict' })
      }
    }
    for (const link of crossLinks) {
      const source = nodeMap.get(link.sourceId)
      const node = link.targetNode
      if (!source) continue
      const dx = node.x - source.x
      const dy = node.y - source.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < (source.r + node.r + 4)) continue
      const ux = dx / (len || 1), uy = dy / (len || 1)
      const sx = source.x + ux * (source.r + 4)
      const sy = source.y + uy * (source.r + 4)
      const ex = node.x - ux * (node.r + 4)
      const ey = node.y - uy * (node.r + 4)
      const isConflict = link.type === 'conflict'
      ctx.save()
      ctx.strokeStyle = isConflict ? 'rgba(201,74,74,0.25)' : 'rgba(58,107,197,0.2)'
      ctx.lineWidth = 0.8
      ctx.setLineDash([4, 4])
      const mx = (sx + ex) / 2
      const my = (sy + ey) / 2
      // 小弧度，避免线条飞太远
      const offset = Math.min(len * 0.15, 40)
      const nx = -dy / (len || 1)
      const ny = dx / (len || 1)
      const cpx = mx + nx * offset
      const cpy = my + ny * offset
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.quadraticCurveTo(cpx, cpy, ex, ey)
      ctx.stroke()
      ctx.setLineDash([])
      // 标签放在曲线中点
      const labelX = mx * 0.5 + cpx * 0.5
      const labelY = my * 0.5 + cpy * 0.5
      ctx.font = '10px "Coming Soon", cursive'
      ctx.fillStyle = isConflict ? 'rgba(201,74,74,0.4)' : 'rgba(58,107,197,0.35)'
      ctx.textAlign = 'center'
      ctx.fillText(isConflict ? '矛盾' : '关联', labelX, labelY - 3)
      ctx.restore()
    }

    // 绘制节点（跳过正在动画的新节点）
    for (const node of nodes) {
      if (newNodeIds.has(node.id)) continue
      const isActive = activeNodeId === node.id
      const isHovered = hoveredId === node.id
      const isInactive = node.activationStatus === 'inactive'
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

    // 绘制标签（跳过正在动画的新节点）— 带碰撞检测避免重叠
    const labelBoxes: { x: number; y: number; w: number; h: number; idx: number }[] = []
    const labelData: { node: LayoutNode; text: string; fontSize: number; baseY: number }[] = []

    for (const node of nodes) {
      if (newNodeIds.has(node.id)) continue
      const isCore = !node.parentId
      const fontSize = isCore ? 18 : 14
      const text = node.label || node.id.slice(0, 6)
      ctx.font = `${fontSize}px "Caveat", cursive`
      const tw = ctx.measureText(text).width
      const baseY = node.y + node.r + (isCore ? 22 : 16)
      labelData.push({ node, text, fontSize, baseY })
      labelBoxes.push({ x: node.x - tw / 2, y: baseY - fontSize, w: tw, h: fontSize + 4, idx: labelBoxes.length })
    }

    // 简单碰撞偏移：如果两个标签重叠，把后面的往下推
    for (let i = 0; i < labelBoxes.length; i++) {
      for (let j = i + 1; j < labelBoxes.length; j++) {
        const a = labelBoxes[i], b = labelBoxes[j]
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
          // 重叠：把 b 往下推
          const shift = a.y + a.h - b.y + 2
          b.y += shift
          labelData[j].baseY += shift
        }
      }
    }

    for (let i = 0; i < labelData.length; i++) {
      const { node, text, fontSize, baseY } = labelData[i]
      const isActive = activeNodeId === node.id
      const isCore = !node.parentId
      const isInactive = node.activationStatus === 'inactive'
      ctx.font = `${fontSize}px "Caveat", cursive`
      ctx.textAlign = 'center'
      ctx.fillStyle = isInactive
        ? 'rgba(34,34,34,0.2)'
        : isActive || hoveredId === node.id
          ? node.color
          : isCore
            ? 'rgba(34,34,34,0.7)'
            : 'rgba(34,34,34,0.5)'
      ctx.fillText(text, node.x, baseY)
    }

    ctx.restore() // 恢复平移和缩放
  }, [nodes, hoveredId, activeNodeId, pan, zoom, newNodeIds])

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

  // 鼠标滚轮缩放（以鼠标位置为中心）
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const step = 0.02
      const direction = e.deltaY > 0 ? -step : step
      setZoom((prev) => {
        const next = Math.min(2.0, Math.max(0.3, prev + direction))
        // 调整 pan 使缩放以鼠标位置为中心
        const scale = next / prev
        setPan((p) => ({
          x: mx - scale * (mx - p.x),
          y: my - scale * (my - p.y)
        }))
        return next
      })
    },
    []
  )

  // 绑定 wheel 事件（passive: false 以支持 preventDefault）
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

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

      {/* 新节点生长动画 —— 线条缓慢延伸 → 节点浮现 */}
      {Array.from(newNodeIds).map((id) => {
        const node = nodes.find((n) => n.id === id)
        if (!node) return null
        const cx = node.x * zoom + pan.x
        const cy = node.y * zoom + pan.y
        const parent = node.parentId
          ? nodes.find((n) => n.id === node.parentId)
          : null
        const px = parent ? parent.x * zoom + pan.x : cx
        const py = parent ? parent.y * zoom + pan.y : cy
        const dx = cx - px
        const dy = cy - py
        const dist = Math.sqrt(dx * dx + dy * dy)
        // 截断后的起止点（不穿过节点）
        const parentR = parent ? parent.r * zoom : 0
        const nodeRScaled = node.r * zoom
        const ux = dist > 0 ? dx / dist : 0
        const uy = dist > 0 ? dy / dist : 0
        const lx1 = px + ux * (parentR + 4)
        const ly1 = py + uy * (parentR + 4)
        const lx2 = cx - ux * (nodeRScaled + 4)
        const ly2 = cy - uy * (nodeRScaled + 4)
        const lineLen = Math.sqrt((lx2 - lx1) ** 2 + (ly2 - ly1) ** 2)
        const lineDur = 1000   // 线生长时长 ms
        const labelDelay = 800 // 标签在线快到终点时浮现
        return (
          <div
            key={`anim-${id}`}
            className="pointer-events-none z-20"
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
          >
            {/* 连线从父节点边缘缓慢生长到子节点边缘 */}
            {parent && lineLen > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <line
                  x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  ref={(el) => {
                    if (!el) return
                    el.setAttribute('stroke-dasharray', String(lineLen))
                    el.setAttribute('stroke-dashoffset', String(lineLen))
                    el.animate(
                      [
                        { strokeDashoffset: lineLen, opacity: 0.2 },
                        { strokeDashoffset: 0, opacity: 0.45 }
                      ],
                      { duration: lineDur, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)', fill: 'forwards' }
                    )
                  }}
                />
              </svg>
            )}
            {/* 标签浮现（线到达后） */}
            <div
              ref={(el) => {
                if (!el) return
                el.animate(
                  [
                    { opacity: 0, transform: 'translateY(4px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                  ],
                  { duration: 500, delay: labelDelay, easing: 'ease-out', fill: 'forwards' }
                )
              }}
              style={{
                position: 'absolute',
                left: cx - 60,
                top: cy + node.r * zoom + 4,
                width: 120,
                textAlign: 'center',
                fontFamily: '"Caveat", cursive',
                fontSize: 14,
                color: 'rgba(34,34,34,0.5)',
                opacity: 0
              }}
            >
              {node.label || node.id.slice(0, 6)}
            </div>
          </div>
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
          直接关系 (parent → child)
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-0 border-t-[1.5px] border-dashed"
            style={{ borderColor: 'rgba(58,107,197,0.4)', width: 24 }}
          />
          关联
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-0 border-t-[1.5px] border-dashed"
            style={{ borderColor: 'rgba(201,74,74,0.5)', width: 24 }}
          />
          矛盾
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

      {/* 缩放指示器（仅非受控模式显示） */}
      {!isZoomControlled && (
        <div
          className="absolute bottom-5 right-6 z-10 cursor-pointer select-none"
          onClick={() => {
            setZoom((prev: number) => {
              const el = containerRef.current
              if (!el) return 1
              const { width, height } = el.getBoundingClientRect()
              const cx = width / 2
              const cy = height / 2
              const scale = 1 / prev
              setPan((p) => ({
                x: cx - scale * (cx - p.x),
                y: cy - scale * (cy - p.y)
              }))
              return 1
            })
          }}
          title="点击重置为 100%"
          style={{
            fontFamily: 'var(--font-hand-sm)',
            fontSize: 13,
            color: 'var(--color-pencil)',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  )
}
