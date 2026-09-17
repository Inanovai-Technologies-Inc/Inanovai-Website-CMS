import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

type ShapeType = 'currency' | 'chart' | 'gear' | 'box' | 'nodes' | 'flow'

interface Particle {
  x: number       // 0–1 normalized
  y: number       // 0–1 normalized (relative to page height)
  vx: number
  vy: number
  size: number
  baseOpacity: number
  type: ShapeType
  symbol: string
  rotation: number
  rotSpeed: number
  parallaxDepth: number  // 0 = stationary, 1 = full scroll speed
  colorVariant: number   // 0 = blue accent, 1 = warm accent
}

const SYMBOLS = ['$', '€', '£', '¥', '₹', '₩']
const TYPES: ShapeType[] = [
  'currency', 'currency', 'currency',
  'chart', 'chart',
  'gear', 'gear',
  'box', 'box',
  'nodes',
  'flow', 'flow',
]

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function initParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: rand(-0.00006, 0.00006),
    vy: rand(0.00003, 0.00012),
    size: rand(18, 46),
    baseOpacity: rand(0.06, 0.14),
    type: TYPES[Math.floor(Math.random() * TYPES.length)],
    symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.003, 0.003),
    parallaxDepth: rand(0.05, 0.35),
    colorVariant: Math.random() > 0.65 ? 1 : 0,
  }))
}

// ── shape drawers ──────────────────────────────────────────────────

function drawCurrency(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.font = `300 ${p.size}px 'JetBrains Mono', monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(p.symbol, 0, 0)
}

function drawChart(ctx: CanvasRenderingContext2D, p: Particle) {
  const heights = [0.45, 0.72, 0.55, 0.90, 0.68, 0.82]
  const barW = p.size * 0.13
  const gap = p.size * 0.06
  const totalW = heights.length * (barW + gap) - gap
  const maxH = p.size * 0.85
  const baseY = maxH * 0.5

  ctx.lineWidth = 1.2
  heights.forEach((h, i) => {
    const barH = h * maxH
    const x = -totalW / 2 + i * (barW + gap)
    ctx.beginPath()
    ctx.rect(x, baseY - barH, barW, barH)
    ctx.stroke()
  })
  // baseline
  ctx.beginPath()
  ctx.moveTo(-totalW / 2 - 2, baseY)
  ctx.lineTo(totalW / 2 + 2, baseY)
  ctx.lineWidth = 0.8
  ctx.stroke()
  // trend line overlay
  ctx.beginPath()
  heights.forEach((h, i) => {
    const cx = -totalW / 2 + i * (barW + gap) + barW / 2
    const cy = baseY - h * maxH
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
  })
  ctx.lineWidth = 0.8
  ctx.setLineDash([2, 3])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawGear(ctx: CanvasRenderingContext2D, p: Particle) {
  const r = p.size * 0.38
  const innerR = r * 0.55
  const teeth = 9
  ctx.lineWidth = 1.2
  ctx.beginPath()
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / (teeth * 2)
    const radius = i % 2 === 0 ? r : r * 0.76
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, innerR, 0, Math.PI * 2)
  ctx.stroke()
  // center dot
  ctx.beginPath()
  ctx.arc(0, 0, innerR * 0.22, 0, Math.PI * 2)
  ctx.fill()
}

function drawBox(ctx: CanvasRenderingContext2D, p: Particle) {
  const s = p.size * 0.38
  ctx.lineWidth = 1.1
  // top face
  ctx.beginPath()
  ctx.moveTo(0, -s * 0.65)
  ctx.lineTo(s, -s * 0.12)
  ctx.lineTo(0, s * 0.38)
  ctx.lineTo(-s, -s * 0.12)
  ctx.closePath()
  ctx.stroke()
  // left face
  ctx.beginPath()
  ctx.moveTo(-s, -s * 0.12)
  ctx.lineTo(0, s * 0.38)
  ctx.lineTo(0, s * 1.05)
  ctx.lineTo(-s, s * 0.55)
  ctx.closePath()
  ctx.stroke()
  // right face
  ctx.beginPath()
  ctx.moveTo(s, -s * 0.12)
  ctx.lineTo(0, s * 0.38)
  ctx.lineTo(0, s * 1.05)
  ctx.lineTo(s, s * 0.55)
  ctx.closePath()
  ctx.stroke()
}

function drawNodes(ctx: CanvasRenderingContext2D, p: Particle) {
  const r = p.size * 0.42
  const nodeR = p.size * 0.07
  const pts = [
    { x: 0, y: -r * 0.9 },
    { x: -r, y: r * 0.55 },
    { x: r, y: r * 0.55 },
    { x: 0, y: r * 0.1 },
  ]
  const connections = [[0,3],[1,3],[2,3],[0,1],[0,2]]
  ctx.lineWidth = 0.8
  connections.forEach(([a, b]) => {
    ctx.beginPath()
    ctx.moveTo(pts[a].x, pts[a].y)
    ctx.lineTo(pts[b].x, pts[b].y)
    ctx.stroke()
  })
  ctx.lineWidth = 1.2
  pts.forEach((pt, i) => {
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, i === 3 ? nodeR * 1.4 : nodeR, 0, Math.PI * 2)
    ctx.stroke()
  })
}

function drawFlow(ctx: CanvasRenderingContext2D, p: Particle) {
  const w = p.size * 0.55
  const h = p.size * 0.22
  ctx.lineWidth = 1.1
  // arrow body
  ctx.beginPath()
  ctx.moveTo(-w / 2, -h / 3)
  ctx.lineTo(w * 0.18, -h / 3)
  ctx.lineTo(w * 0.18, -h * 0.62)
  ctx.lineTo(w / 2, 0)
  ctx.lineTo(w * 0.18, h * 0.62)
  ctx.lineTo(w * 0.18, h / 3)
  ctx.lineTo(-w / 2, h / 3)
  ctx.closePath()
  ctx.stroke()
  // small label box to the left
  const bw = w * 0.32
  const bh = h * 0.9
  ctx.beginPath()
  ctx.rect(-w / 2 - bw - p.size * 0.06, -bh / 2, bw, bh)
  ctx.stroke()
}

// ─────────────────────────────────────────────────────────────────

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COUNT = 32
    const particles = initParticles(COUNT)
    let scrollY = window.scrollY
    let pageH = document.documentElement.scrollHeight
    let animId = 0

    const onScroll = () => { scrollY = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      pageH = document.documentElement.scrollHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const blueColor  = isDark ? '77, 143, 214' : '61, 126, 200'
    const warmColor  = isDark ? '240, 80, 48'  : '232, 70, 28'

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        // update position
        p.x += p.vx
        p.y += p.vy / pageH * canvas.height * 0.5

        // wrap horizontally
        if (p.x < -0.1) p.x = 1.1
        if (p.x > 1.1)  p.x = -0.1

        // wrap vertically in page space
        if (p.y > 1.1) p.y = -0.05
        if (p.y < -0.1) p.y = 1.05

        p.rotation += p.rotSpeed

        // screen position with parallax
        const screenX = p.x * canvas.width
        // particle lives at page-relative y; subtract scroll offset adjusted by parallax depth
        const pageY = p.y * pageH
        const screenY = pageY - scrollY * (1 - p.parallaxDepth)

        // skip if off screen vertically
        if (screenY < -p.size * 2 || screenY > canvas.height + p.size * 2) return

        const rgb = p.colorVariant === 1 ? warmColor : blueColor
        ctx.save()
        ctx.globalAlpha = p.baseOpacity
        ctx.strokeStyle = `rgb(${rgb})`
        ctx.fillStyle   = `rgb(${rgb})`
        ctx.translate(screenX, screenY)
        ctx.rotate(p.rotation)

        switch (p.type) {
          case 'currency': drawCurrency(ctx, p); break
          case 'chart':    drawChart(ctx, p);    break
          case 'gear':     drawGear(ctx, p);     break
          case 'box':      drawBox(ctx, p);      break
          case 'nodes':    drawNodes(ctx, p);    break
          case 'flow':     drawFlow(ctx, p);     break
        }

        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
    }
  }, [isDark])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: isDark ? 0.9 : 0.7,
      }}
    />
  )
}
