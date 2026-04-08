import { useRef, useEffect } from 'react'

/** 静态手绘涂鸦纸团 — 用 Canvas 绘制，和拓扑核心节点同风格 */
export function ScribbleBall({ size = 80, color = '#3a6bc5' }: { size?: number; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const cx = size / 2, cy = size / 2, r = size * 0.36

    // 用固定种子模拟 "随机" 让每次渲染一致
    let seed = 42
    const rnd = (range: number) => {
      seed = (seed * 16807 + 0) % 2147483647
      return ((seed / 2147483647) - 0.5) * 2 * range
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // 锯齿填充
    const fillAngle = -0.4
    const cosA = Math.cos(fillAngle), sinA = Math.sin(fillAngle)
    const spacing = 3.5
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
    ctx.lineWidth = 1.4
    ctx.globalAlpha = 0.55
    ctx.stroke()

    // 手绘圆圈
    for (let ring = 0; ring < 2; ring++) {
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
      ctx.globalAlpha = 0.75 - ring * 0.2
      ctx.stroke()
    }
  }, [size, color])

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />
}
