import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

// A loose constellation of drifting nodes with proximity-based connecting
// lines — a data/signal motif rather than the finance iconography this
// replaced (currency symbols, gears, bar charts). Ambient only: low
// opacity, no pointer events, ignored by screen readers.
interface Node {
  x: number // 0–1 normalized, horizontal
  y: number // 0–1 normalized, relative to page height
  vx: number
  vy: number
  radius: number
  parallaxDepth: number // 0 = stationary, 1 = full scroll speed
  colorVariant: number // 0 = blue accent, 1 = warm accent (rare, intentional)
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function initNodes(count: number): Node[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: rand(-0.00003, 0.00003),
    vy: rand(0.00002, 0.00006),
    radius: rand(1.2, 2.6),
    parallaxDepth: rand(0.08, 0.32),
    colorVariant: Math.random() > 0.82 ? 1 : 0,
  }))
}

// A link's opacity fades to zero past this many pixels of separation, so
// the network reads as a sparse constellation rather than a dense mesh.
const LINK_DISTANCE = 160

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COUNT = 46
    const nodes = initNodes(COUNT)
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

    const blueColor = isDark ? '77, 143, 214' : '61, 126, 200'
    const warmColor = isDark ? '240, 80, 48' : '206, 62, 25'
    const lineColor = isDark ? '77, 143, 214' : '107, 107, 128'
    const nodeAlpha = isDark ? 0.55 : 0.4
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Resolve each node's current screen position once per frame.
      const screen = nodes.map((n) => {
        if (!reduceMotion) {
          n.x += n.vx
          n.y += n.vy / pageH * canvas.height * 0.5

          if (n.x < -0.05) n.x = 1.05
          if (n.x > 1.05) n.x = -0.05
          if (n.y > 1.05) n.y = -0.05
          if (n.y < -0.05) n.y = 1.05
        }

        const screenX = n.x * canvas.width
        const pageY = n.y * pageH
        const screenY = pageY - scrollY * (1 - n.parallaxDepth)
        return { screenX, screenY, node: n }
      })

      // Links first, so nodes sit visually on top of their own connections.
      for (let i = 0; i < screen.length; i++) {
        const a = screen[i]
        if (a.screenY < -40 || a.screenY > canvas.height + 40) continue

        for (let j = i + 1; j < screen.length; j++) {
          const b = screen[j]
          const dx = a.screenX - b.screenX
          const dy = a.screenY - b.screenY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > LINK_DISTANCE) continue

          const opacity = (1 - dist / LINK_DISTANCE) * 0.16
          ctx.beginPath()
          ctx.moveTo(a.screenX, a.screenY)
          ctx.lineTo(b.screenX, b.screenY)
          ctx.strokeStyle = `rgba(${lineColor}, ${opacity})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // Nodes.
      screen.forEach(({ screenX, screenY, node }) => {
        if (screenY < -20 || screenY > canvas.height + 20) return
        const rgb = node.colorVariant === 1 ? warmColor : blueColor
        ctx.beginPath()
        ctx.arc(screenX, screenY, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, ${nodeAlpha})`
        ctx.fill()
      })

      if (!reduceMotion) animId = requestAnimationFrame(draw)
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
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: isDark ? 0.85 : 0.6,
      }}
    />
  )
}
