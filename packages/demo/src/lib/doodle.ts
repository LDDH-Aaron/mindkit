/** 手绘涂鸦风格的 Canvas 绘图工具 */

/** 随机偏移 */
function rnd(range: number): number {
  return (Math.random() - 0.5) * 2 * range
}

/** 手绘抖动线条 */
export function wobblyLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  wobble = 1.5,
) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const steps = Math.max(Math.floor(len / 8), 4)
  const nx = -dy / len, ny = dx / len

  ctx.beginPath()
  ctx.moveTo(x1 + rnd(wobble), y1 + rnd(wobble))
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    ctx.lineTo(
      x1 + dx * t + nx * rnd(wobble),
      y1 + dy * t + ny * rnd(wobble),
    )
  }
  ctx.stroke()
}

/** 手绘涂鸦填充节点 */
export function scribbleNode(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  color: string,
  alpha: number,
  isHovered: boolean,
) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 锯齿填充
  const fillAngle = -0.4 + rnd(0.15)
  const cosA = Math.cos(fillAngle), sinA = Math.sin(fillAngle)
  const spacing = 3.5 + rnd(0.5)
  const fillR = r * 0.95
  const count = Math.ceil(fillR * 2 / spacing)

  ctx.beginPath()
  let first = true
  for (let i = 0; i < count; i++) {
    const yLocal = -fillR + i * spacing + rnd(1)
    const halfChord = Math.sqrt(Math.max(0, fillR * fillR - yLocal * yLocal))
    if (halfChord < 2) continue
    const goRight = i % 2 === 0
    const x1 = goRight ? -halfChord : halfChord
    const x2 = goRight ? halfChord : -halfChord
    const sx1 = cx + x1 * cosA - yLocal * sinA + rnd(1.5)
    const sy1 = cy + x1 * sinA + yLocal * cosA + rnd(1.5)
    const sx2 = cx + x2 * cosA - yLocal * sinA + rnd(1.5)
    const sy2 = cy + x2 * sinA + yLocal * cosA + rnd(1.5)
    if (first) { ctx.moveTo(sx1, sy1); first = false }
    else { ctx.lineTo(sx1, sy1) }
    const midX = (sx1 + sx2) / 2 + rnd(2)
    const midY = (sy1 + sy2) / 2 + rnd(2)
    ctx.quadraticCurveTo(midX, midY, sx2, sy2)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 1.4 + (isHovered ? 0.4 : 0)
  ctx.globalAlpha = alpha * 0.55
  ctx.stroke()

  // 手绘圆圈轮廓
  const rings = isHovered ? 2 : 1
  for (let ring = 0; ring < rings; ring++) {
    const rr = r + ring * 1.5 + rnd(1)
    const w = 2.5 + ring
    const startA = rnd(0.5)
    const sweep = Math.PI * 2 + rnd(0.6) - 0.1
    const steps = 32
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const a = startA + (i / steps) * sweep
      const wr = rr + rnd(w)
      const x = cx + Math.cos(a) * wr
      const y = cy + Math.sin(a) * wr
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.6 - ring * 0.3
    ctx.globalAlpha = alpha * (0.75 - ring * 0.2)
    ctx.stroke()
  }

  ctx.restore()
}

/** 节点颜色表 */
const NODE_COLORS = ['#3a6bc5', '#c94a4a', '#5ba85b', '#c78a30', '#7E57C2']

export function getNodeColor(index: number): string {
  return NODE_COLORS[index % NODE_COLORS.length]
}

export interface LayoutNode {
  id: string
  label: string
  x: number
  y: number
  r: number
  color: string
  children: string[]
  parentId?: string
  sourceSessionId?: string
  activationStatus?: 'activated' | 'inactive' | 'user-extended'
}

/** 树节点输入类型 */
interface TreeInput {
  id: string
  label: string
  sourceSessionId?: string
  activationStatus?: 'activated' | 'inactive' | 'user-extended'
  turnCount: number
  children: TreeInput[]
}

/** 基于 id 的确定性伪随机（避免每帧抖动） */
function seededRandom(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return ((h & 0x7fffffff) % 1000) / 1000
}

/** 递归统计子树总叶节点数（用于按权重分配角度） */
function countLeaves(node: TreeInput): number {
  if (!node.children || node.children.length === 0) return 1
  return node.children.reduce((s, c) => s + countLeaves(c), 0)
}

/** 将 session 树转换为布局节点（发散辐射布局） */
export function computeLayout(
  tree: TreeInput[],
  width: number,
  height: number,
): LayoutNode[] {
  const nodes: LayoutNode[] = []
  const cx = width / 2, cy = height / 2
  const ringSpacing = Math.min(width, height) / 5

  interface QueueItem {
    node: TreeInput
    layer: number
    parentId?: string
    parentX: number
    parentY: number
    angle: number
  }

  const queue: QueueItem[] = []

  // 根节点的子节点均匀散开，起始角度偏移让布局更有机
  const isSingleRoot = tree.length === 1

  if (isSingleRoot) {
    // 单根：根在中心，子节点辐射散开
    queue.push({
      node: tree[0],
      layer: 0,
      parentX: cx,
      parentY: cy,
      angle: 0,
    })
  } else {
    const span = (2 * Math.PI) / tree.length
    tree.forEach((n, i) => {
      queue.push({
        node: n,
        layer: 0,
        parentX: cx,
        parentY: cy,
        angle: i * span - Math.PI / 2,
      })
    })
  }

  let colorIdx = 0
  while (queue.length > 0) {
    const item = queue.shift()!
    const { node, layer, parentId, parentX, parentY, angle } = item

    // 确定性抖动（单子节点时角度偏移更大，避免全往同一方向）
    const sr = seededRandom(node.id)
    const siblingCount = parentId ? (nodes.find(n => n.id === parentId)?.children.length ?? 0) + 1 : 1
    const jitterAngle = siblingCount <= 1
      ? (sr - 0.5) * Math.PI * 1.2  // 单子节点：±108° 大幅随机
      : (sr - 0.5) * 0.3
    const jitterR = (seededRandom(node.id + '_r') - 0.5) * 16

    const radius = layer === 0 ? 0 : ringSpacing * (0.7 + layer * 0.55) + jitterR
    const x = layer === 0 ? cx : parentX + Math.cos(angle + jitterAngle) * radius
    const y = layer === 0 ? cy : parentY + Math.sin(angle + jitterAngle) * radius
    // 核心节点更大，层级越深越小
    const r = layer === 0 ? 28 : Math.max(8, 16 - layer * 2)
    const color = layer === 0 ? '#3a6bc5' : getNodeColor(colorIdx++)
    if (layer > 0) colorIdx++

    nodes.push({
      id: node.id,
      label: node.label,
      x, y, r, color,
      children: (node.children || []).map((c: TreeInput) => c.id),
      parentId,
      sourceSessionId: node.sourceSessionId,
      activationStatus: node.activationStatus,
    })

    const children = node.children || []
    if (children.length === 0) continue

    // 按子树叶节点数加权分配角度
    const totalLeaves = children.reduce((s, c) => s + countLeaves(c), 0)
    // 根节点的子节点用整圈均匀辐射，其他层级用扇面
    const fanAngle = layer === 0
      ? Math.PI * 2
      : Math.min(Math.PI * 0.8, (Math.PI / 3) * children.length)
    const startAngle = layer === 0
      ? -Math.PI / 2  // 从顶部开始均匀分布
      : angle - fanAngle / 2

    let accumulated = 0
    children.forEach((child: TreeInput) => {
      const weight = countLeaves(child) / totalLeaves
      const childAngle = startAngle + (accumulated + weight / 2) * fanAngle
      accumulated += weight
      queue.push({
        node: child,
        layer: layer + 1,
        parentId: node.id,
        parentX: x,
        parentY: y,
        angle: childAngle,
      })
    })
  }

  return nodes
}
