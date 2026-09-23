import { motion, useReducedMotion } from 'framer-motion'
import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { EASE } from './ease'

type CardProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: 'div' | 'a' | 'article'
  href?: string
  target?: string
  rel?: string
  onClick?: (e: MouseEvent<HTMLDivElement | HTMLAnchorElement>) => void
}

// The one card treatment used across Services, Why Us, Demo, Careers, and
// Blog: soft elevation + border, a small hover lift, and a cursor-tracked
// spotlight glow. Content/layout stays entirely up to the caller — this only
// owns the shared shell so the five sections read as one system.
export default function Card({ children, className, style, as = 'div', href, target, rel, onClick }: CardProps) {
  const shouldReduceMotion = useReducedMotion()
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement | HTMLAnchorElement>) => {
    if (shouldReduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const MotionComponent = motion[as]

  return (
    <MotionComponent
      className={className}
      href={as === 'a' ? href : undefined}
      target={as === 'a' ? target : undefined}
      rel={as === 'a' ? rel : undefined}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.25, ease: EASE }}
      style={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        textDecoration: 'none',
        color: 'inherit',
        cursor: as === 'a' || onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Cursor-tracked spotlight — decorative only, never intercepts input. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
          background: `radial-gradient(360px circle at ${pos.x}% ${pos.y}%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)`,
        }}
      />
      {children}
    </MotionComponent>
  )
}
