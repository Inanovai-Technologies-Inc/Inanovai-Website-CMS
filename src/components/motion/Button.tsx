import { motion, useReducedMotion } from 'framer-motion'
import { useState, type AriaAttributes, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { EASE } from './ease'

type ButtonVariant = 'primary' | 'secondary'

// Extends AriaAttributes so callers can pass aria-expanded/aria-controls/etc
// straight through (e.g. a details-disclosure toggle) — spread onto the
// underlying element below rather than silently dropped.
type ButtonProps = AriaAttributes & {
  children: ReactNode
  variant?: ButtonVariant
  as?: 'a' | 'button'
  href?: string
  type?: 'button' | 'submit'
  target?: string
  rel?: string
  className?: string
  style?: CSSProperties
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  // Opt-in override for a caller that sets its own `backgroundColor` (which
  // otherwise wins over the variant's hover state, since `style` is spread
  // last) and still wants a brightened hover tint. Unused by every other
  // call site, so this has no effect on the default variant hover.
  hoverBackgroundColor?: string
}

// The one interactive treatment for every CTA on the site: a small lift on
// hover, a press-in on click, and a variant-appropriate glow/border tint —
// applied consistently instead of each call site inventing its own hover.
// Sizing (padding, font-size) stays with the caller via `style`.
export default function Button({
  children,
  variant = 'primary',
  as = 'a',
  href,
  type,
  target,
  rel,
  className,
  style,
  onClick,
  hoverBackgroundColor,
  ...aria
}: ButtonProps) {
  const shouldReduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const MotionComponent = motion[as]

  const variantStyle: CSSProperties =
    variant === 'primary'
      ? {
          fontWeight: 700,
          color: 'var(--accent-foreground)',
          backgroundColor: 'var(--accent-strong)',
          border: '1.5px solid transparent',
          boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        }
      : {
          fontWeight: 600,
          color: 'var(--foreground)',
          backgroundColor: hovered ? 'var(--panel-hover, var(--muted))' : 'transparent',
          border: `1.5px solid ${hovered ? 'var(--foreground)' : 'var(--border)'}`,
          boxShadow: 'none',
        }

  return (
    <MotionComponent
      {...aria}
      href={as === 'a' ? href : undefined}
      type={as === 'button' ? (type ?? 'button') : undefined}
      target={as === 'a' ? target : undefined}
      rel={as === 'a' ? rel : undefined}
      onClick={onClick}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      style={{
        fontFamily: 'var(--font-display-family)',
        letterSpacing: '0.01em',
        borderRadius: 'var(--radius)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
        ...variantStyle,
        ...style,
        ...(hovered && hoverBackgroundColor ? { backgroundColor: hoverBackgroundColor } : null),
      }}
    >
      {children}
    </MotionComponent>
  )
}
