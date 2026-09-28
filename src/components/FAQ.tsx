import { useEffect, useState, type CSSProperties } from 'react'
import { STRAPI_URL } from '../config'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal, { staggerDelay } from './motion/Reveal'
import { EASE } from './motion/ease'

const FAQ_ENDPOINT = `${STRAPI_URL}/api/faqs`

const PAGE_SIZE = 100

type FAQEntry = {
  id: number
  documentId?: string
  question?: string
  answer?: string
  displayOrder?: number
}

type StrapiCollectionResponse = {
  data?: FAQEntry[] | null
}

type FAQ = {
  key: string
  question: string
  answer: string
  displayOrder: number
}

function normalize(entry: FAQEntry, i: number): FAQ {
  return {
    key: entry.documentId ?? String(entry.id),
    question: entry.question ?? '',
    answer: entry.answer ?? '',
    displayOrder: entry.displayOrder ?? i + 1,
  }
}

const statusStyle = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.75rem',
  letterSpacing: '0.06em',
  color: 'var(--muted-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '2.5rem',
  textAlign: 'center',
} as const

const plusMinusStyle: CSSProperties = {
  width: '1.25rem',
  height: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: 'var(--foreground)',
  transition: 'transform 0.2s ease',
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  )
}

export default function FAQ() {
  const shouldReduceMotion = useReducedMotion() ?? false
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFAQs() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${FAQ_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        const sorted = entries
          .map(normalize)
          .sort((a, b) => a.displayOrder - b.displayOrder)

        setFaqs(sorted)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setFaqs([])
        setError(err instanceof Error ? err.message : 'Unable to reach the FAQ API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadFAQs()
    return () => controller.abort()
  }, [])

  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())

  const isFAQOpen = (key: string): boolean => openKeys.has(key)

  const toggleFAQ = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <section
      id="faq"
      style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 500,
              marginBottom: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--accent)' }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--foreground)',
            }}>
              Frequently Asked Questions
            </h2>
          </div>
        </Reveal>

        {loading && <div style={statusStyle}>Loading FAQs…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load FAQs. {error}
          </div>
        )}

        {!loading && !error && faqs.length === 0 && (
          <div style={statusStyle}>No FAQs published yet.</div>
        )}

        {!loading && !error && faqs.length > 0 && (
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <Reveal key={faq.key} delay={staggerDelay(i)}>
                <FAQItem
                  faq={faq}
                  isOpen={isFAQOpen(faq.key)}
                  onToggle={() => toggleFAQ(faq.key)}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FAQItem({
  faq,
  isOpen,
  onToggle,
  shouldReduceMotion,
}: {
  faq: FAQ
  isOpen: boolean
  onToggle: () => void
  shouldReduceMotion: boolean
}) {
  const answerId = `faq-answer-${faq.key}`

  return (
    <motion.div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '2rem',
          backgroundColor: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-display-family)',
          fontSize: '1.0625rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {faq.question}
        <motion.span
          style={plusMinusStyle}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: EASE }}
        >
          {isOpen ? <MinusIcon /> : <PlusIcon />}
        </motion.span>
      </button>

      <motion.div
        id={answerId}
        role="region"
        aria-labelledby={`faq-question-${faq.key}`}
        initial={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: EASE }}
        style={{ overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '0 2rem 2rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--muted)',
          }}
        >
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.75,
            color: 'var(--muted-foreground)',
          }}>
            {faq.answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}