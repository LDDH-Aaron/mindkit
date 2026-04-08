import { useRef, useEffect, useState, useCallback } from 'react'
import type { TopoNode } from '@/lib/types'

/** 布局后节点 */
interface LayoutNode extends TopoNode {
  x: number
  y: number
  size: number
  color: string
  glowColor: string
  brightness: number
}

/** Camera 状态 */
interface Camera {
  x: number
  y: number
  zoom: number
}

/** 颜色配置 */
const COLORS = {
  bg: '#F8FAFC',
  bgEdge: '#F1F5F9',
  line: 'rgba(99,102,241,0.3)',
  lineHighlight: 'rgba(99,102,241,0.7)',
  lineDim: 'rgba(99,102,241,0.1)',
  mainNode: '#6366F1',
  mainGlow: 'rgba(99,102,241,0.3)',
  childNode: '#8B5CF6',
  childGlow: 'rgba(139,92,246,0.2)',
  leafNode: '#22C55E',
  leafGlow: 'rgba(34,197,94,0.2)',
}

/** 同心环布局算法 */
function computeLayout(nodes: TopoNode[], width: number, height: number): LayoutNode[] {
  const cx = width / 2
  const cy = height / 2
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const result: LayoutNode[] = []

  const root = nodes.find((n) => n.parentId === null)
  if (!root) return result

  // BFS 分层
  const layers: TopoNode[][] = [[root]]
  const visited = new Set([root.id])
  let current = [root]

  while (current.length > 0) {
    const next: TopoNode[] = []
    for (const node of current) {
      for (const childId of node.children) {
        const child = nodeMap.get(childId)
        if (child && !visited.has(child.id)) {
          visited.add(child.id)
          next.push(child)
        }
      }
    }
    if (next.length > 0) layers.push(next)
    current = next
  }

  const ringSpacing = Math.min(width, height) * 0.18
  const maxTurns = Math.max(...nodes.map((n) => n.turns), 1)

  for (let layer = 0; layer < layers.length; layer++) {
    const ring = layers[layer]!
    const radius = layer === 0 ? 0 : ringSpacing * layer

    for (let i = 0; i < ring.length; i++) {
      const node = ring[i]!
      const isMain = node.parentId === null
      const angle = ring.length === 1 ? 0 : (2 * Math.PI * i) / ring.length - Math.PI / 2

      // 随机偏移
      const jitterX = layer === 0 ? 0 : Math.sin(i * 7.3 + layer * 2.1) * ringSpacing * 0.15
      const jitterY = layer === 0 ? 0 : Math.cos(i * 5.7 + layer * 3.4) * ringSpacing * 0.15

      const x = cx + Math.cos(angle) * radius + jitterX
      const y = cy + Math.sin(angle) * radius + jitterY

      const sizeBase = isMain ? 18 : 6
      const sizeScale = (node.turns / maxTurns) * 10
      const size = sizeBase + sizeScale

      let color: string, glowColor: string
      if (isMain) {
        color = COLORS.mainNode
        glowColor = COLORS.mainGlow
      } else if (node.children.length === 0) {
        color = COLORS.leafNode
        glowColor = COLORS.leafGlow
      } else {
        color = COLORS.childNode
        glowColor = COLORS.childGlow
      }

      const brightness = node.status === 'archived' ? 0.5 : 0.8 + (node.turns / maxTurns) * 0.2
      result.push({ ...node, x, y, size, color, glowColor, brightness })
    }
  }

  return result
}

/** 屏幕坐标 → 世界坐标 */
function screenToWorld(sx: number, sy: number, cam: Camera): { wx: number; wy: number } {
  return { wx: sx / cam.zoom - cam.x, wy: sy / cam.zoom - cam.y }
}

/** 渲染一帧 */
function renderFrame(
  ctx: CanvasRenderingContext2D,
  nodes: LayoutNode[],
  width: number,
  height: number,
  highlightedId: string | null,
  selectedId: string | null,
  time: number,
) {
  // 背景
  const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width)
  grad.addColorStop(0, COLORS.bg)
  grad.addColorStop(1, COLORS.bgEdge)
  ctx.fillStyle = grad
  const margin = 2000
  ctx.fillRect(-margin, -margin, width + margin * 2, height + margin * 2)

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // 画连线
  for (const node of nodes) {
    if (!node.parentId) continue
    const parent = nodeMap.get(node.parentId)
    if (!parent) continue

    const isHighlighted = highlightedId !== null && (node.id === highlightedId || parent.id === highlightedId)

    ctx.beginPath()
    ctx.moveTo(parent.x, parent.y)
    ctx.lineTo(node.x, node.y)
    ctx.strokeStyle = isHighlighted ? COLORS.lineHighlight : highlightedId ? COLORS.lineDim : COLORS.line
    ctx.lineWidth = isHighlighted ? 3 : parent.parentId === null ? 2.5 : 1.5
    ctx.shadowColor = COLORS.line
    ctx.shadowBlur = isHighlighted ? 12 : 6
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // 画节点
  for (const node of nodes) {
    const isHighlighted = node.id === highlightedId
    const isSelected = node.id === selectedId
    const dimmed = highlightedId !== null && !isHighlighted && node.parentId !== highlightedId
      && !(highlightedId && nodeMap.get(highlightedId)?.parentId === node.id)

    // 呼吸效果
    const pulse = Math.sin(time * 0.002 + node.x * 0.01 + node.y * 0.01) * 0.15 + 1
    const animatedSize = Math.max(1, node.size * (isHighlighted ? 1.2 : pulse))

    ctx.beginPath()
    ctx.arc(node.x, node.y, animatedSize, 0, Math.PI * 2)
    ctx.fillStyle = node.color
    ctx.globalAlpha = dimmed ? 0.25 : node.brightness
    ctx.shadowColor = node.glowColor
    ctx.shadowBlur = isHighlighted ? 35 : dimmed ? 4 : node.size + 8
    ctx.fill()
    ctx.shadowBlur = 0

    // 选中光环
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, animatedSize + 5, 0, Math.PI * 2)
      ctx.strokeStyle = node.color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6 + Math.sin(time * 0.005) * 0.2
      ctx.stroke()
    }

    ctx.globalAlpha = 1

    // 标签
    const isMain = node.parentId === null
    ctx.font = `${isMain ? '600' : '500'} ${isMain ? 12 : 10}px Outfit, system-ui`
    ctx.fillStyle = node.color
    ctx.globalAlpha = dimmed ? 0.2 : 0.9
    ctx.textAlign = 'left'
    ctx.fillText(node.label, node.x + animatedSize + 6, node.y + 4)
    ctx.globalAlpha = 1
  }
}

interface TopologyCanvasProps {
  nodes: TopoNode[]
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string) => void
}

/** 节点拓扑图组件 */
export function TopologyCanvas({ nodes, selectedNodeId, onNodeSelect }: TopologyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<LayoutNode[]>([])
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 })
  const dragRef = useRef({ active: false, startX: 0, startY: 0 })
  const highlightedRef = useRef<string | null>(null)
  const selectedRef = useRef<string | null>(null)

  useEffect(() => { highlightedRef.current = highlighted }, [highlighted])
  useEffect(() => { selectedRef.current = selectedNodeId }, [selectedNodeId])

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // 布局计算
  useEffect(() => {
    nodesRef.current = computeLayout(nodes, size.width, size.height)
  }, [nodes, size])

  // rAF 渲染循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const loop = (time: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = size.width
      const h = size.height

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cam = cameraRef.current
      ctx.save()
      ctx.translate(cam.x * cam.zoom, cam.y * cam.zoom)
      ctx.scale(cam.zoom, cam.zoom)

      renderFrame(ctx, nodesRef.current, w, h, highlightedRef.current, selectedRef.current, time)

      ctx.restore()
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [size])

  /** 查找鼠标下的节点 */
  const findNodeAt = useCallback((sx: number, sy: number): LayoutNode | undefined => {
    const cam = cameraRef.current
    const { wx, wy } = screenToWorld(sx, sy, cam)
    // 从后往前遍历（后绘制的在上面）
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i]!
      const dx = wx - node.x
      const dy = wy - node.y
      const hitRadius = Math.max(node.size + 4, 12)
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return node
    }
    return undefined
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const cam = cameraRef.current
      cameraRef.current = { ...cam, x: cam.x + dx / cam.zoom, y: cam.y + dy / cam.zoom }
      dragRef.current.startX = e.clientX
      dragRef.current.startY = e.clientY
      return
    }

    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const node = findNodeAt(sx, sy)
    setHighlighted(node?.id ?? null)

    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = node ? 'pointer' : 'default'
  }, [findNodeAt])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDrag = Math.abs(e.clientX - dragRef.current.startX) > 3
      || Math.abs(e.clientY - dragRef.current.startY) > 3
    dragRef.current.active = false

    if (wasDrag) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const node = findNodeAt(sx, sy)
    if (node) onNodeSelect(node.id)
  }, [findNodeAt, onNodeSelect])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const cam = cameraRef.current
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, cam.zoom * zoomFactor))
    cameraRef.current = { ...cam, zoom: newZoom }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          dragRef.current.active = false
          setHighlighted(null)
        }}
        onWheel={handleWheel}
        className="w-full h-full"
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
          暂无节点
        </div>
      )}
    </div>
  )
}
