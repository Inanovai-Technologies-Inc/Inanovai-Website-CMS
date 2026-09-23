import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import { EASE } from './ease'

const DURATION = 0.6

const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

type RevealProps = {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}

// Fades + rises an element in once, the first time it scrolls into view.
// Renders statically (no animation) when the visitor prefers reduced motion.
export default function Reveal({ children, delay = 0, className, style }: RevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className} style={style}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
      transition={{ duration: DURATION, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// Caps stagger delay so long grids (careers, blog) don't take forever to
// finish revealing — every item past ~5 lands at the same time as the 5th.
export function staggerDelay(index: number, step = 0.06, max = 0.3): number {
  return Math.min(index * step, max)
}
