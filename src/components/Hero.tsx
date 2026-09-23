import { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import Button from './motion/Button'
import Reveal from './motion/Reveal'
import { EASE } from './motion/ease'

const HERO_ENDPOINT = 'http://localhost:1337/api/homes'
const HOME_CHAT_ENDPOINT = 'http://localhost:1337/api/home-chats'

type HeroFields = {
  eyebrow?: string
  heading?: string
  headingAccent?: string
  description?: string
  secondaryDescription?: string
  primaryCta?: string
  primaryCtaLink?: string
  secondaryCta?: string
  secondaryCtaLink?: string
  anjuLabel?: string
  erpStat?: string
  industryStat?: string
  opensourceStat?: string
  anjuStatLabel?: string
  erpStatLabel?: string
  industryStatLabel?: string
  opensourceStatLabel?: string
}

type HeroEntry = HeroFields & {
  id?: number
  documentId?: string
  attributes?: HeroFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiHeroResponse = {
  data?: HeroEntry | HeroEntry[] | null
}

function pickEntry(data: StrapiHeroResponse['data']): HeroEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalize(entry: HeroEntry): HeroFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

// The Home Chat collection backs the simulated ANJU conversation in the
// identity card. Kept as its own type/fetch, separate from the Hero fields.
type ChatFields = {
  userMessage1?: string
  anjuResponse1?: string
  userMessage2?: string
  anjuResponse2?: string
  thinkingText?: string
}

type ChatEntry = ChatFields & {
  id?: number
  documentId?: string
  attributes?: ChatFields
}

type StrapiChatResponse = {
  data?: ChatEntry[] | null
}

// The original copy bolded the leading "ANJU" mention inline. Preserve that
// treatment when the fetched description still contains the word, without
// requiring the field to carry markup.
function withAnjuEmphasis(text: string) {
  const i = text.indexOf('ANJU')
  if (i === -1) return text

  return (
    <>
      {text.slice(0, i)}
      <strong style={{ color: 'var(--foreground)', fontWeight: 700 }}>ANJU</strong>
      {text.slice(i + 4)}
    </>
  )
}

// Stagger the left-column copy in on load (not scroll — Hero is already in
// view at mount, so this animates immediately rather than via whileInView).
const columnVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

// Parses a leading number out of a CMS stat string ("50+", "12+", "100%")
// so it can be counted up to, keeping the original prefix/suffix intact.
// Returns null for non-numeric stats (e.g. the fixed "ANJU" value), which
// fall back to rendering as plain text.
function parseStatValue(raw: string): { target: number; prefix: string; suffix: string } | null {
  const match = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return null
  const [, prefix, numStr, suffix] = match
  return { target: parseFloat(numStr), prefix, suffix }
}

function CountUpStat({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const shouldReduceMotion = useReducedMotion()
  const parsed = parseStatValue(value)
  const [display, setDisplay] = useState(parsed ? '0' : value)

  useEffect(() => {
    if (!parsed || !isInView) return

    if (shouldReduceMotion) {
      setDisplay(String(parsed.target))
      return
    }

    const controls = animate(0, parsed.target, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setDisplay(String(Math.round(v))),
    })
    return () => controls.stop()
    // parsed is derived fresh from `value` each render; re-running on
    // identity change would restart the count, so depend on value instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, shouldReduceMotion, value])

  if (!parsed) return <div ref={ref}>{value}</div>
  return <div ref={ref}>{parsed.prefix}{display}{parsed.suffix}</div>
}

export default function Hero() {
  const [hero, setHero] = useState<HeroFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadHero() {
      try {
        const response = await fetch(HERO_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiHeroResponse = await response.json()
        const entry = pickEntry(payload.data)

        setHero(entry ? normalize(entry) : null)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setHero(null)
        setError(err instanceof Error ? err.message : 'Unable to reach the hero API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadHero()
    return () => controller.abort()
  }, [])

  const [chat, setChat] = useState<ChatFields | null>(null)
  const [chatLoading, setChatLoading] = useState(true)
  const [chatError, setChatError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadChat() {
      try {
        const response = await fetch(HOME_CHAT_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiChatResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []
        const entry = entries[0]

        setChat(entry ? (entry.attributes ?? entry) : null)
        setChatError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setChat(null)
        setChatError(err instanceof Error ? err.message : 'Unable to reach the home chat API.')
      } finally {
        if (!controller.signal.aborted) setChatLoading(false)
      }
    }

    loadChat()
    return () => controller.abort()
  }, [])

  // CTA targets are in-page anchors, not marketing copy, so they fall back
  // to the section's own original hrefs rather than going dead while
  // loading or if Strapi is unreachable.
  const primaryCtaLink = hero?.primaryCtaLink || '#anju'
  const secondaryCtaLink = hero?.secondaryCtaLink || '#contact'

  // Subtle mouse parallax on the two ambient glows. Springs smooth the
  // motion; reduced-motion visitors get static glows (handler is a no-op).
  const shouldReduceMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 0.6 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 0.6 })
  const blueGlowX = useTransform(springX, [-0.5, 0.5], [14, -14])
  const blueGlowY = useTransform(springY, [-0.5, 0.5], [10, -10])
  const warmGlowX = useTransform(springX, [-0.5, 0.5], [-10, 10])
  const warmGlowY = useTransform(springY, [-0.5, 0.5], [-8, 8])

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      onMouseMove={handleHeroMouseMove}
      style={{ backgroundColor: 'var(--background)', minHeight: '92vh', display: 'flex', alignItems: 'center' }}
    >
      {/* Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          opacity: 0.6,
        }}
      />

      {/* Blue glow — top right */}
      <motion.div style={{
        position: 'absolute', top: '-15%', right: '-8%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 68%)',
        pointerEvents: 'none',
        x: blueGlowX,
        y: blueGlowY,
      }} />

      {/* Warm glow — bottom left */}
      <motion.div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-warm) 8%, transparent) 0%, transparent 70%)',
        pointerEvents: 'none',
        x: warmGlowX,
        y: warmGlowY,
      }} />

      <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <motion.div
            variants={columnVariants}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
          >
            {loading && (
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                color: 'var(--muted-foreground)',
                marginBottom: '1rem',
              }}>
                Loading hero content…
              </div>
            )}

            {!loading && error && (
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                color: 'var(--accent-warm)',
                marginBottom: '1rem',
              }}>
                Hero content unavailable. {error}
              </div>
            )}

            <motion.div variants={itemVariants} style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent-warm)',
              fontWeight: 500,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', background: 'linear-gradient(90deg, var(--accent-warm), var(--accent-warm-end))' }} />
              {hero?.eyebrow ?? ''}
            </motion.div>

            <motion.h1 variants={itemVariants} style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--foreground)',
              marginBottom: '1.75rem',
            }}>
              {hero?.heading ?? ''}{' '}
              <span style={{
                background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--accent-warm)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {hero?.headingAccent ?? ''}
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} style={{
              fontSize: '1.0625rem',
              lineHeight: 1.75,
              color: 'var(--muted-foreground)',
              maxWidth: '36rem',
              marginBottom: '0.875rem',
              fontWeight: 400,
            }}>
              {hero?.description ? withAnjuEmphasis(hero.description) : ''}
            </motion.p>

            <motion.p variants={itemVariants} style={{
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: 'var(--muted-foreground)',
              maxWidth: '34rem',
              marginBottom: '2.5rem',
            }}>
              {hero?.secondaryDescription ?? ''}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Button as="a" href={primaryCtaLink} variant="primary" style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}>
                {hero?.primaryCta ?? 'Explore ANJU'}
              </Button>
              <Button as="a" href={secondaryCtaLink} variant="secondary" style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}>
                {hero?.secondaryCta ?? 'Book a Discovery Call'}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — ANJU identity card (chat content stays hardcoded) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--card)',
              boxShadow: '0 24px 64px color-mix(in srgb, var(--accent) 8%, transparent)',
            }}
          >
            {/* Card header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              backgroundColor: 'var(--background)',
            }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F57', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#28C840', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em', marginLeft: '0.5rem' }}>
                {hero?.anjuLabel ?? 'ANJU · Adaptive Neural Junction for Users'}
              </span>
            </div>

            {/* Simulated chat — content from the Home Chat collection */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatLoading && (
                <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Loading chat…
                </div>
              )}

              {!chatLoading && chatError && (
                <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.75rem', color: 'var(--accent-warm)' }}>
                  Chat unavailable. {chatError}
                </div>
              )}

              {[
                {
                  role: 'user',
                  text: chat?.userMessage1 ?? '',
                },
                {
                  role: 'anju',
                  text: chat?.anjuResponse1 ?? '',
                },
                {
                  role: 'user',
                  text: chat?.userMessage2 ?? '',
                },
                {
                  role: 'anju',
                  text: chat?.anjuResponse2 ?? '',
                },
              ].map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: msg.role === 'user' ? 'var(--accent-strong)' : 'var(--secondary)',
                    color: msg.role === 'user' ? 'var(--accent-foreground)' : 'var(--foreground)',
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    fontFamily: 'var(--font-body-family)',
                  }}>
                    {msg.role === 'anju' && (
                      <div style={{
                        fontFamily: 'var(--font-mono-family)',
                        fontSize: '0.5625rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        marginBottom: '0.375rem',
                        fontWeight: 600,
                      }}>ANJU</div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', paddingLeft: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>{chat?.thinkingText ?? ''}</span>
                {[0, 1, 2].map(d => (
                  <span key={d} style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'inline-block',
                    animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats row — the ANJU stat's value stays fixed brand copy; the
            other three values and all four labels come from Strapi. Numeric
            values count up once when this row scrolls into view. */}
        <Reveal className="mt-20 flex flex-wrap gap-12" style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
          {[
            { id: 'anju', value: 'ANJU', label: hero?.anjuStatLabel ?? '' },
            { id: 'erp', value: hero?.erpStat ?? '', label: hero?.erpStatLabel ?? '' },
            { id: 'industry', value: hero?.industryStat ?? '', label: hero?.industryStatLabel ?? '' },
            { id: 'opensource', value: hero?.opensourceStat ?? '', label: hero?.opensourceStatLabel ?? '' },
          ].map((stat) => (
            <div key={stat.id}>
              <div style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: stat.value === 'ANJU' ? '1.75rem' : '2rem',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: stat.value === 'ANJU' ? 'var(--accent)' : 'var(--foreground)',
              }}>
                <CountUpStat value={stat.value} />
              </div>
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
                marginTop: '0.25rem',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </Reveal>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1.1);  }
        }
      `}</style>
    </section>
  )
}
