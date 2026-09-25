import { useState, useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Reveal from './motion/Reveal'
import Button from './motion/Button'
import { EASE } from './motion/ease'

const CAPABILITIES_ENDPOINT = 'http://localhost:1337/api/anju-capabilities'

// Strapi caps a collection request at 25 by default; ask for more so newly
// added capabilities keep appearing without touching this file again.
const PAGE_SIZE = 100

type CapabilityEntry = {
  id: number
  documentId?: string
  title?: string
  body?: string
  icon?: string
  Number?: number
}

type StrapiCollectionResponse = {
  data?: CapabilityEntry[] | null
}

type Capability = {
  key: string
  icon: string
  title: string
  body: string
  order: number
}

function normalize(entry: CapabilityEntry): Capability {
  return {
    key: entry.documentId ?? String(entry.id),
    icon: entry.icon ?? '',
    title: entry.title ?? '',
    body: entry.body ?? '',
    order: entry.Number ?? 0,
  }
}

const statusStyle = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.75rem',
  letterSpacing: '0.06em',
  color: 'var(--panel-fg-muted)',
  border: '1px solid var(--panel-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '2.5rem',
  textAlign: 'center',
} as const

const SCENARIOS_ENDPOINT = 'http://localhost:1337/api/anju-scenarios'

const ANJU_SECTION_ENDPOINT = 'http://localhost:1337/api/anju-section'

// ── Section header types ────────────────────────────────────────
type AnjuSectionFields = {
  eyebrow?: string
  headingLine1?: string
  headingLine2?: string
  description?: string
}

type AnjuSectionEntry = AnjuSectionFields & {
  id?: number
  documentId?: string
  attributes?: AnjuSectionFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiAnjuSectionResponse = {
  data?: AnjuSectionEntry | AnjuSectionEntry[] | null
}

function pickSectionEntry(data: StrapiAnjuSectionResponse['data']): AnjuSectionEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeAnjuSection(entry: AnjuSectionEntry): AnjuSectionFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

// Strapi's actual content type is the plural collection "anju-integrations"
// (one published entry), not the singular single-type URL this originally
// assumed — that mismatch is what produced the 404.
const INTEGRATION_ENDPOINT = 'http://localhost:1337/api/anju-integrations'
const INTEGRATION_CARDS_ENDPOINT = 'http://localhost:1337/api/anju-integration-cards'

// ── Integration strip types ─────────────────────────────────────
type IntegrationEntry = {
  eyebrow?: string
  heading?: string
  description?: string
  ctaHeading?: string
  ctaDescription?: string
  ctaButtonText?: string
  ctaButtonLink?: string
}

// Tolerate either a single-type shape (data: object) or a collection-type
// shape (data: array), since the live API turned out to be the latter.
type StrapiIntegrationResponse = {
  data?: IntegrationEntry | IntegrationEntry[] | null
}

function pickIntegrationEntry(data: StrapiIntegrationResponse['data']): IntegrationEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

type IntegrationSection = {
  eyebrow: string
  title: string
  description: string
  ctaHeading: string
  ctaDescription: string
  ctaButtonText: string
  ctaButtonLink: string
}

// No content fallbacks — a missing individual field renders empty rather
// than inventing marketing copy. A missing entry entirely (unavailable,
// unpublished, or an invalid response) is handled by the caller as an
// error/empty state, not silently papered over here.
function normalizeIntegrationSection(entry: IntegrationEntry): IntegrationSection {
  return {
    eyebrow: entry.eyebrow ?? '',
    title: entry.heading ?? '',
    description: entry.description ?? '',
    ctaHeading: entry.ctaHeading ?? '',
    ctaDescription: entry.ctaDescription ?? '',
    ctaButtonText: entry.ctaButtonText ?? '',
    ctaButtonLink: entry.ctaButtonLink ?? '',
  }
}

type IntegrationCardEntry = {
  id: number
  documentId?: string
  name?: string
  description?: string
  icon?: string
  order?: number
}

type StrapiIntegrationCardsResponse = {
  data?: IntegrationCardEntry[] | null
}

type IntegrationCard = {
  key: string
  name: string
  description: string
  icon: string
  order: number
}

function normalizeIntegrationCard(entry: IntegrationCardEntry): IntegrationCard {
  return {
    key: entry.documentId ?? String(entry.id),
    name: entry.name ?? '',
    description: entry.description ?? '',
    icon: entry.icon ?? '',
    order: entry.order ?? 0,
  }
}

// Maps a Strapi `icon` value to one of the existing hardcoded SVGs.
function normalizeIconKey(icon: string): string {
  return icon.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

const PLATFORM_VISUALS: Record<string, { icon: ReactNode; color: string }> = {
  teams: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M17.5 8.75a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" fill="#5059C9"/>
        <path d="M20.125 10.5h-4.667a.583.583 0 0 0-.583.583v5.834A4.083 4.083 0 0 1 10.792 21H9.625A4.625 4.625 0 0 0 14.25 25.375h5.875A2.625 2.625 0 0 0 22.75 22.75V13.125A2.625 2.625 0 0 0 20.125 10.5Z" fill="#5059C9"/>
        <circle cx="10.5" cy="8.167" r="3.167" fill="#7B83EB"/>
        <path d="M4.083 12.833A2.333 2.333 0 0 0 6.417 15.167h8.166A2.333 2.333 0 0 0 16.917 12.833V12A2.333 2.333 0 0 0 14.583 9.667H6.417A2.333 2.333 0 0 0 4.083 12v.833Z" fill="#7B83EB"/>
        <path d="M10.5 15.167v5.25a4.083 4.083 0 0 1-4.083-4.084v-1.166h2.917A1.167 1.167 0 0 0 10.5 15.167Z" fill="#5059C9"/>
      </svg>
    ),
    color: '#5059C9',
  },
  googlechat: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3.5C8.201 3.5 3.5 8.201 3.5 14c0 5.799 4.701 10.5 10.5 10.5h.583V19.25H14A7.875 7.875 0 0 1 6.125 11.375 7.875 7.875 0 0 1 14 3.5Z" fill="#0F9D58"/>
        <path d="M22.458 9.625A10.476 10.476 0 0 0 14 3.5v5.833a4.667 4.667 0 1 1 0 9.334H14v5.25A10.5 10.5 0 0 0 24.5 14a10.44 10.44 0 0 0-2.042-4.375Z" fill="#4285F4"/>
        <circle cx="14" cy="14" r="3.5" fill="#FBBC05"/>
      </svg>
    ),
    color: '#4285F4',
  },
  whatsapp: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M14 3.5C8.201 3.5 3.5 8.201 3.5 14c0 1.969.548 3.81 1.5 5.378L3.5 24.5l5.291-1.468A10.44 10.44 0 0 0 14 24.5c5.799 0 10.5-4.701 10.5-10.5S19.799 3.5 14 3.5Z" fill="#25D366"/>
        <path d="M19.076 16.748c-.28-.14-1.662-.82-1.92-.912-.258-.093-.445-.14-.632.14-.187.28-.724.912-.888 1.099-.163.187-.327.21-.607.07-.28-.14-1.18-.435-2.248-1.388-.831-.741-1.392-1.657-1.555-1.937-.163-.28-.017-.431.122-.57.126-.126.28-.327.42-.49.14-.163.187-.28.28-.467.094-.187.047-.35-.023-.49-.07-.14-.632-1.522-.866-2.083-.228-.548-.46-.474-.632-.483l-.538-.009c-.187 0-.49.07-.747.35-.257.28-.98.958-.98 2.335s1.003 2.707 1.143 2.894c.14.187 1.975 3.015 4.783 4.228.668.288 1.19.46 1.596.589.67.213 1.28.183 1.762.111.537-.08 1.662-.68 1.896-1.337.234-.658.234-1.222.163-1.34-.07-.117-.257-.187-.538-.327Z" fill="white"/>
      </svg>
    ),
    color: '#25D366',
  },
  telegram: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10.5" fill="url(#tg-grad)"/>
        <path d="M8.283 13.868l8.5-3.278c.394-.143.738.096.611.691l-1.449 6.822c-.107.482-.393.6-.797.373l-2.2-1.622-1.063 1.024c-.118.118-.217.217-.445.217l.158-2.244 4.09-3.696c.178-.158-.039-.246-.275-.088l-5.054 3.18-2.178-.68c-.473-.148-.483-.473.099-.7Z" fill="white"/>
        <defs>
          <linearGradient id="tg-grad" x1="14" y1="3.5" x2="14" y2="24.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2AABEE"/>
            <stop offset="1" stopColor="#229ED9"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: '#2AABEE',
  },
}

// Aliases in case Strapi stores slightly different icon slugs.
const PLATFORM_VISUAL_ALIASES: Record<string, keyof typeof PLATFORM_VISUALS> = {
  teams: 'teams',
  microsoftteams: 'teams',
  msteams: 'teams',
  googlechat: 'googlechat',
  google: 'googlechat',
  chat: 'googlechat',
  gchat: 'googlechat',
  whatsapp: 'whatsapp',
  wa: 'whatsapp',
  telegram: 'telegram',
  tg: 'telegram',
}

function getPlatformVisual(icon: string) {
  const key = PLATFORM_VISUAL_ALIASES[normalizeIconKey(icon)]
  return key ? PLATFORM_VISUALS[key] : PLATFORM_VISUALS.teams
}

type PlatformDemoKey = keyof typeof PLATFORM_VISUALS

type PlatformTurn = {
  user: string
  response: string
}

type PlatformMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
}

type PlatformDemo = {
  title: string
  turns: PlatformTurn[]
}

const PLATFORM_DEMOS: Record<PlatformDemoKey, PlatformDemo> = {
  teams: {
    title: 'Microsoft Teams',
    turns: [
      { user: 'Any purchase requests waiting for approval?', response: 'Yes. 2 purchase requests are waiting for approval.' },
      { user: 'Show me the details.', response: 'PR-104 — Office equipment — ₹42,000\nPR-107 — Software licenses — ₹18,500' },
      { user: 'Approve PR-104.', response: 'PR-104 is ready for approval. Confirm to proceed?' },
      { user: 'Confirm.', response: 'PR-104 has been approved.' },
    ],
  },
  googlechat: {
    title: 'Google Chat',
    turns: [
      { user: "Give me today's business summary.", response: "Today's summary:\nRevenue: ₹18.4L\nPending POs: 3\nLow-stock items: 5" },
      { user: 'What needs attention first?', response: '2 inventory items are critically low and 1 purchase order is overdue.' },
      { user: 'Show the critical items.', response: 'Product A — 12 units\nProduct C — 8 units' },
    ],
  },
  whatsapp: {
    title: 'WhatsApp',
    turns: [
      { user: 'Check stock for Product A.', response: 'Product A has 124 units available. The reorder point is 150 units. Reorder is recommended.' },
      { user: 'Create a reorder request.', response: "I've prepared a reorder request for Product A. Please confirm before submitting." },
      { user: 'Confirm.', response: 'Reorder request created successfully.' },
    ],
  },
  telegram: {
    title: 'Telegram',
    turns: [
      { user: 'Any urgent operational alerts?', response: '2 alerts need attention:\n• Product A — low stock\n• PO-108 — pending approval' },
      { user: 'Show Product A.', response: 'Product A has 12 units remaining. The reorder point is 50 units.' },
      { user: 'Create a reorder request.', response: 'Reorder request prepared. Confirm to submit?' },
      { user: 'Confirm.', response: 'Reorder request submitted.' },
    ],
  },
}

function PlatformDemoPanel({ platform, onClose }: { platform: PlatformDemoKey; onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion()
  const [messages, setMessages] = useState<PlatformMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const conversationRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visual = PLATFORM_VISUALS[platform]
  const demo = PLATFORM_DEMOS[platform]
  const lastResponse = demo.turns[demo.turns.length - 1].response
  const isComplete = messages.some((message) => message.role === 'assistant' && message.content === lastResponse)

  const normalizeMessage = (message: string) => message.trim().toLowerCase()

  const getResponse = (message: string) => {
    const matchingTurn = demo.turns.find((turn) => normalizeMessage(turn.user) === normalizeMessage(message))
    return matchingTurn?.response ?? "That's available in the full ANJU experience. Try one of the suggested business questions above."
  }

  const sendMessage = (message = input) => {
    const trimmed = message.trim()
    if (!trimmed || isTyping) return

    const response = getResponse(trimmed)
    const messageId = Date.now()
    setMessages((previous) => [...previous, { id: messageId, role: 'user', content: trimmed }])
    setInput('')
    setIsTyping(true)
    typingTimeoutRef.current = setTimeout(() => {
      setMessages((previous) => [...previous, { id: messageId + 1, role: 'assistant', content: response }])
      setIsTyping(false)
      typingTimeoutRef.current = null
    }, shouldReduceMotion ? 0 : 650)
  }

  const resetConversation = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = null
    setMessages([])
    setInput('')
    setIsTyping(false)
  }

  const nextSuggestion = demo.turns.find((turn) => !messages.some((message) => message.role === 'user' && normalizeMessage(message.content) === normalizeMessage(turn.user)))?.user

  useEffect(() => {
    const conversation = conversationRef.current
    if (!conversation) return
    conversation.scrollTo({ top: conversation.scrollHeight, behavior: shouldReduceMotion ? 'auto' : 'smooth' })
  }, [messages, isTyping, shouldReduceMotion])

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        role="presentation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'color-mix(in srgb, var(--background) 82%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anju-platform-demo-title"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18, scale: shouldReduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: EASE }}
          style={{
            width: 'min(100%, 34rem)',
            maxHeight: 'min(720px, calc(100vh - 2rem))',
            overflowY: 'auto',
            border: '1px solid var(--panel-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--panel-surface)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--panel-border-soft)',
            backgroundColor: 'var(--panel-surface-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <div style={{ flex: '0 0 auto' }}>{visual.icon}</div>
              <div>
                <div id="anju-platform-demo-title" style={{ fontFamily: 'var(--font-display-family)', fontSize: '1rem', fontWeight: 800, color: 'var(--panel-fg)' }}>
                  ANJU · {demo.title}
                </div>
                <div style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--panel-fg-faint)' }}>
                  Concept demo · no live connection
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label={`Close ${demo.title} demo`}
              onClick={onClose}
              style={{ flex: '0 0 auto', width: '2rem', height: '2rem', border: '1px solid var(--panel-border-strong)', borderRadius: '50%', backgroundColor: 'transparent', color: 'var(--panel-fg-subtle)', fontSize: '1.25rem', lineHeight: 1, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div ref={conversationRef} aria-live="polite" style={{ maxHeight: 'min(48vh, 30rem)', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: visual.color }}>
              What interacting with ANJU could look like
            </div>

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: EASE }}
                style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div style={{ maxWidth: message.role === 'user' ? '82%' : '88%', padding: message.role === 'user' ? '0.75rem 1rem' : '0.875rem 1rem', whiteSpace: 'pre-line', borderRadius: message.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', backgroundColor: message.role === 'user' ? `color-mix(in srgb, ${visual.color} 16%, transparent)` : 'var(--panel-surface-2)', border: message.role === 'user' ? `1px solid color-mix(in srgb, ${visual.color} 35%, transparent)` : '1px solid var(--panel-border)', color: 'var(--panel-fg-body)', fontSize: '0.875rem', lineHeight: message.role === 'user' ? 1.6 : 1.7 }}>
                  {message.role === 'assistant' && <div style={{ marginBottom: '0.375rem', fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: visual.color, fontWeight: 700 }}>ANJU</div>}
                  {message.content}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ alignSelf: 'flex-start', padding: '0.625rem 0.875rem', borderRadius: '12px 12px 12px 2px', backgroundColor: 'var(--panel-surface-2)', border: '1px solid var(--panel-border)', color: 'var(--panel-fg-subtle)', fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', letterSpacing: '0.08em' }}
              >
                ANJU is typing...
              </motion.div>
            )}
          </div>

          <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {nextSuggestion && !isTyping && (
              <button
                type="button"
                onClick={() => sendMessage(nextSuggestion)}
                style={{ alignSelf: 'flex-start', maxWidth: '100%', padding: '0.5rem 0.75rem', border: `1px solid color-mix(in srgb, ${visual.color} 40%, var(--panel-border))`, borderRadius: 'var(--radius)', backgroundColor: 'transparent', color: 'var(--panel-fg-body)', fontFamily: 'var(--font-body-family)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left' }}
              >
                {nextSuggestion}
              </button>
            )}

            <form onSubmit={(event) => { event.preventDefault(); sendMessage() }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
                aria-label={`Message ANJU on ${demo.title}`}
                disabled={isTyping}
                style={{ minWidth: 0, flex: 1, padding: '0.7rem 0.8rem', border: '1px solid var(--panel-border-strong)', borderRadius: 'var(--radius)', backgroundColor: 'var(--panel-input)', color: 'var(--panel-fg-body)', fontFamily: 'var(--font-body-family)', fontSize: '0.8125rem', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                style={{ flex: '0 0 auto', padding: '0.7rem 0.9rem', border: 0, borderRadius: 'var(--radius)', backgroundColor: visual.color, color: '#fff', fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer', opacity: !input.trim() || isTyping ? 0.5 : 1 }}
              >
                Send
              </button>
            </form>

            {isComplete && (
              <button
                type="button"
                onClick={resetConversation}
                style={{ alignSelf: 'flex-start', padding: 0, border: 0, backgroundColor: 'transparent', color: 'var(--panel-fg-subtle)', fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Start again
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Shared types ──────────────────────────────────────────────
type Scenario = { label: string; query: string; response: string }

type ScenarioEntry = {
  id: number
  documentId?: string
  title?: string
  query?: string
  response?: string
  order?: number
}

type StrapiScenariosResponse = {
  data?: ScenarioEntry[] | null
}

function normalizeScenario(entry: ScenarioEntry): Scenario {
  return {
    label: entry.title ?? '',
    query: entry.query ?? '',
    response: entry.response ?? '',
  }
}

// Types out ANJU's response a few characters at a time when it changes —
// reinforces that this is a live generated answer, not static copy. Resets
// whenever `text` changes (i.e. the active scenario advances). Renders the
// full text immediately under prefers-reduced-motion.
function TypewriterText({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion()
  const [shown, setShown] = useState(shouldReduceMotion ? text.length : 0)

  useEffect(() => {
    if (shouldReduceMotion) {
      setShown(text.length)
      return
    }

    setShown(0)
    let i = 0
    const CHARS_PER_TICK = 2
    const TICK_MS = 12
    const id = setInterval(() => {
      i += CHARS_PER_TICK
      setShown(Math.min(i, text.length))
      if (i >= text.length) clearInterval(id)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [text, shouldReduceMotion])

  const done = shown >= text.length

  return (
    <>
      {text.slice(0, shown)}
      {!done && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '2px',
            height: '0.9em',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            backgroundColor: 'var(--panel-accent)',
            animation: 'anju-cursor-blink 0.8s step-end infinite',
          }}
        />
      )}
    </>
  )
}

// ── Shared chat panel ─────────────────────────────────────────
function ChatPanel({ scenario }: { scenario: Scenario }) {
  return (
    <div style={{
      border: '1px solid var(--panel-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      backgroundColor: 'var(--panel-surface)',
    }}>
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--panel-border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: 'var(--panel-surface-2)',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['rgba(255,95,87,0.6)', 'rgba(255,189,46,0.6)', 'rgba(40,200,64,0.6)'].map((c) => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', color: 'var(--panel-fg-faint)', letterSpacing: '0.1em', marginLeft: '0.5rem' }}>
          anju-session · {scenario.label.toLowerCase()} context
        </span>
      </div>

      <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '75%', padding: '0.75rem 1.125rem',
            borderRadius: '12px 12px 2px 12px',
            backgroundColor: 'color-mix(in srgb, var(--panel-accent) 28%, transparent)', border: '1px solid color-mix(in srgb, var(--panel-accent) 42%, transparent)',
            fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--panel-fg-body)',
            fontFamily: 'var(--font-body-family)',
          }}>
            {scenario.query}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{
            maxWidth: '80%', padding: '1rem 1.25rem',
            borderRadius: '12px 12px 12px 2px',
            backgroundColor: 'var(--panel-surface-2)', border: '1px solid var(--panel-border)',
            fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--panel-fg-body)',
            fontFamily: 'var(--font-body-family)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--panel-accent)', fontWeight: 600, marginBottom: '0.5rem' }}>
              ANJU
            </div>
            <TypewriterText text={scenario.response} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Scroll-driven version (lg+) ───────────────────────────────
function ScrollScenarios({ scenarios }: { scenarios: Scenario[] }) {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const scrolled = Math.max(0, -rect.top)
      const total = Math.min(1, scrolled / scrollable)
      const raw = total * scenarios.length
      setActive(Math.min(scenarios.length - 1, Math.floor(raw)))
      setProgress(total >= 1 ? 1 : raw % 1)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [scenarios.length])

  return (
    <div ref={containerRef} className="hidden lg:block" style={{ height: `${scenarios.length * 100}vh` }}>
      <div style={{ position: 'sticky', top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2.5rem' }}>
        <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--panel-fg-subtle)' }}>
          ANJU in context — scroll to explore
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left: scenario list with progress bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {scenarios.map((s, i) => {
              const isPast = i < active
              const isCurrent = i === active
              const barWidth = isPast ? '100%' : isCurrent ? `${progress * 100}%` : '0%'
              return (
                <div key={s.label}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', marginBottom: '0.625rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: isCurrent ? 'var(--panel-accent)' : isPast ? 'var(--panel-fg-faint)' : 'var(--panel-fg-faint)', letterSpacing: '0.1em', transition: 'color 0.4s' }}>
                      0{i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display-family)', fontSize: '1.0625rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? 'var(--panel-fg)' : isPast ? 'var(--panel-fg-faint)' : 'var(--panel-fg-subtle)', letterSpacing: '-0.01em', transition: 'all 0.4s' }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ height: '2px', backgroundColor: 'var(--panel-border-soft)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: barWidth, backgroundColor: 'var(--panel-accent)', borderRadius: 1, transition: isCurrent ? 'width 0.1s linear' : 'width 0.4s ease' }} />
                  </div>
                  {isCurrent && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--panel-fg-subtle)', fontFamily: 'var(--font-body-family)' }}>
                      {s.query}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right: animated chat panel */}
          <div style={{ transition: 'opacity 0.35s, transform 0.35s' }}>
            <ChatPanel scenario={scenarios[active]} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Click-tab fallback (mobile) ───────────────────────────────
function ClickScenarios({ scenarios }: { scenarios: Scenario[] }) {
  const [active, setActive] = useState(0)
  return (
    <div className="lg:hidden">
      <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--panel-fg-subtle)', marginBottom: '1.5rem' }}>
        ANJU in context — select a scenario
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {scenarios.map((s, i) => (
          <button key={s.label} onClick={() => setActive(i)} style={{
            fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.5rem 1.25rem', borderRadius: 'var(--radius)',
            border: `1px solid ${active === i ? 'var(--panel-accent)' : 'var(--panel-border-strong)'}`,
            backgroundColor: active === i ? 'var(--panel-accent-strong)' : 'transparent',
            color: active === i ? 'var(--accent-foreground)' : 'var(--panel-fg-subtle)',
            cursor: 'pointer', transition: 'all 0.15s', fontWeight: 500,
          }}>
            {s.label}
          </button>
        ))}
      </div>
      <ChatPanel scenario={scenarios[active]} />
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────
export default function Anju() {
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCapabilities() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${CAPABILITIES_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setCapabilities(entries.map(normalize).sort((a, b) => a.order - b.order))
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setCapabilities([])
        setError(err instanceof Error ? err.message : 'Unable to reach the ANJU capabilities API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadCapabilities()
    return () => controller.abort()
  }, [])

  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenariosLoading, setScenariosLoading] = useState(true)
  const [scenariosError, setScenariosError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadScenarios() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${SCENARIOS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiScenariosResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setScenarios(entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(normalizeScenario))
        setScenariosError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setScenarios([])
        setScenariosError(err instanceof Error ? err.message : 'Unable to reach the ANJU scenarios API.')
      } finally {
        if (!controller.signal.aborted) setScenariosLoading(false)
      }
    }

    loadScenarios()
    return () => controller.abort()
  }, [])

  const [section, setSection] = useState<AnjuSectionFields | null>(null)
  const [sectionLoading, setSectionLoading] = useState(true)
  const [sectionError, setSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSection() {
      try {
        const response = await fetch(ANJU_SECTION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiAnjuSectionResponse = await response.json()
        const entry = pickSectionEntry(payload.data)

        setSection(entry ? normalizeAnjuSection(entry) : null)
        setSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setSection(null)
        setSectionError(err instanceof Error ? err.message : 'Unable to reach the ANJU section API.')
      } finally {
        if (!controller.signal.aborted) setSectionLoading(false)
      }
    }

    loadSection()
    return () => controller.abort()
  }, [])

  const [integrationSection, setIntegrationSection] = useState<IntegrationSection | null>(null)
  const [integrationSectionLoading, setIntegrationSectionLoading] = useState(true)
  const [integrationSectionError, setIntegrationSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadIntegrationSection() {
      try {
        const response = await fetch(INTEGRATION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiIntegrationResponse = await response.json()
        const entry = pickIntegrationEntry(payload.data)

        setIntegrationSection(entry ? normalizeIntegrationSection(entry) : null)
        setIntegrationSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setIntegrationSection(null)
        setIntegrationSectionError(err instanceof Error ? err.message : 'Unable to reach the ANJU integration section API.')
      } finally {
        if (!controller.signal.aborted) setIntegrationSectionLoading(false)
      }
    }

    loadIntegrationSection()
    return () => controller.abort()
  }, [])

  const [integrationCards, setIntegrationCards] = useState<IntegrationCard[]>([])
  const [integrationCardsLoading, setIntegrationCardsLoading] = useState(true)
  const [integrationCardsError, setIntegrationCardsError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<PlatformDemoKey | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadIntegrationCards() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${INTEGRATION_CARDS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiIntegrationCardsResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setIntegrationCards(entries.map(normalizeIntegrationCard).sort((a, b) => a.order - b.order))
        setIntegrationCardsError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setIntegrationCards([])
        setIntegrationCardsError(err instanceof Error ? err.message : 'Unable to reach the ANJU integration cards API.')
      } finally {
        if (!controller.signal.aborted) setIntegrationCardsLoading(false)
      }
    }

    loadIntegrationCards()
    return () => controller.abort()
  }, [])

  return (
    <section
      id="anju"
      style={{
        backgroundColor: 'var(--panel-bg)',
        color: 'var(--panel-fg-body)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-24">

        {/* Header */}
        <Reveal className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          <div>
            <div style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--panel-accent)',
              fontWeight: 500,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--panel-accent)' }} />
              {section?.eyebrow ?? ''}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              color: 'var(--panel-fg)',
            }}>
              {section?.headingLine1 ?? ''}<br />
              {section?.headingLine2 ?? ''}
            </h2>
          </div>
          <p style={{
            fontSize: '1rem',
            lineHeight: 1.75,
            color: 'var(--panel-fg-muted)',
            maxWidth: '32rem',
          }}>
            {sectionLoading ? '' : sectionError ? `Section content unavailable. ${sectionError}` : (section?.description ?? '')}
          </p>
        </Reveal>

        {/* Capabilities grid */}
        {loading && <div style={{ ...statusStyle, marginBottom: '6rem' }}>Loading capabilities…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
            marginBottom: '6rem',
          }}>
            Could not load capabilities. {error}
          </div>
        )}

        {!loading && !error && capabilities.length === 0 && (
          <div style={{ ...statusStyle, marginBottom: '6rem' }}>No capabilities published yet.</div>
        )}

        {!loading && !error && capabilities.length > 0 && (
          <Reveal
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-24"
            style={{ border: '1px solid var(--panel-border)', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}
          >
            {capabilities.map((cap, i) => {
              // Cells keep the original three-column rule: a right border
              // except in the last column, a bottom border except in the
              // last row — generalized so any capability count lays out
              // correctly, not just the original hardcoded six.
              const lastRowStart = Math.floor((capabilities.length - 1) / 3) * 3
              return (
                <div
                  key={cap.key}
                  style={{
                    padding: '2rem 2.25rem',
                    borderRight: i % 3 !== 2 ? '1px solid var(--panel-border-soft)' : undefined,
                    borderBottom: i < lastRowStart ? '1px solid var(--panel-border-soft)' : undefined,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono-family)',
                    fontSize: '1.25rem',
                    color: 'var(--panel-accent)',
                    marginBottom: '1rem',
                    display: 'block',
                  }}>
                    {cap.icon}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display-family)',
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: 'var(--panel-fg)',
                    marginBottom: '0.625rem',
                    lineHeight: 1.3,
                  }}>
                    {cap.title}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                    color: 'var(--panel-fg-muted)',
                  }}>
                    {cap.body}
                  </p>
                </div>
              )
            })}
          </Reveal>
        )}

        {scenariosLoading && <div style={statusStyle}>Loading scenarios…</div>}

        {!scenariosLoading && scenariosError && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load scenarios. {scenariosError}
          </div>
        )}

        {!scenariosLoading && !scenariosError && scenarios.length === 0 && (
          <div style={statusStyle}>No scenarios published yet.</div>
        )}

        {!scenariosLoading && !scenariosError && scenarios.length > 0 && (
          <>
            {/* ── Scroll-driven scenario demo (desktop) ── */}
            <ScrollScenarios scenarios={scenarios} />

            {/* ── Click-tab fallback (mobile) ── */}
            <ClickScenarios scenarios={scenarios} />
          </>
        )}

        {/* Platform integration strip + CTA */}
        {integrationSectionLoading && (
          <div style={{ ...statusStyle, marginTop: '4rem' }}>Loading integration section…</div>
        )}

        {!integrationSectionLoading && integrationSectionError && (
          <div style={{
            ...statusStyle,
            marginTop: '4rem',
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load integration section. {integrationSectionError}
          </div>
        )}

        {!integrationSectionLoading && !integrationSectionError && !integrationSection && (
          <div style={{ ...statusStyle, marginTop: '4rem' }}>No integration section published yet.</div>
        )}

        {!integrationSectionLoading && !integrationSectionError && integrationSection && (
          <>
        <Reveal style={{
          marginTop: '4rem',
          padding: '2.5rem',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--panel-surface)',
        }}>
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div style={{ flex: '0 0 auto', maxWidth: '22rem' }}>
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--panel-accent)',
                fontWeight: 500,
                marginBottom: '0.75rem',
              }}>
                {integrationSection.eyebrow}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--panel-fg)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                marginBottom: '0.625rem',
              }}>
                {integrationSection.title}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                lineHeight: 1.7,
                color: 'var(--panel-fg-subtle)',
              }}>
                {integrationSection.description}
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'stretch' }}>
              {integrationCardsLoading && <div style={{ ...statusStyle, flex: 1 }}>Loading integrations…</div>}

              {!integrationCardsLoading && integrationCardsError && (
                <div style={{
                  ...statusStyle,
                  flex: 1,
                  color: 'var(--accent-warm)',
                  borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
                }}>
                  Could not load integrations. {integrationCardsError}
                </div>
              )}

              {!integrationCardsLoading && !integrationCardsError && integrationCards.length === 0 && (
                <div style={{ ...statusStyle, flex: 1 }}>No integrations published yet.</div>
              )}

              {!integrationCardsLoading && !integrationCardsError && integrationCards.map((card) => {
                const visual = getPlatformVisual(card.icon)
                const platformKey = PLATFORM_VISUAL_ALIASES[normalizeIconKey(card.icon)] ?? PLATFORM_VISUAL_ALIASES[normalizeIconKey(card.name)]
                return (
                  <div
                    key={card.key}
                    role="button"
                    tabIndex={platformKey ? 0 : -1}
                    aria-label={platformKey ? `Open ${card.name} ANJU demo` : card.name}
                    onClick={() => platformKey && setActivePlatform(platformKey)}
                    onKeyDown={(event) => {
                      if (platformKey && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        setActivePlatform(platformKey)
                      }
                    }}
                    style={{
                      flex: '1 1 calc(50% - 0.5rem)',
                      minWidth: '160px',
                      padding: '1.25rem',
                      border: '1px solid var(--panel-border-soft)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--panel-surface)',
                      transition: 'border-color 0.2s, background-color 0.2s',
                      cursor: platformKey ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `color-mix(in srgb, ${visual.color} 40%, transparent)`
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${visual.color} 6%, transparent)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--panel-border-soft)'
                      e.currentTarget.style.backgroundColor = 'var(--panel-surface)'
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>{visual.icon}</div>
                    <div style={{
                      fontFamily: 'var(--font-display-family)',
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: 'var(--panel-fg)',
                      marginBottom: '0.375rem',
                      letterSpacing: '-0.01em',
                    }}>
                      {card.name}
                    </div>
                    <div style={{
                      fontSize: '0.8125rem',
                      lineHeight: 1.65,
                      color: 'var(--panel-fg-subtle)',
                      fontFamily: 'var(--font-body-family)',
                    }}>
                      {card.description}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>

        {activePlatform && (
          <PlatformDemoPanel platform={activePlatform} onClose={() => setActivePlatform(null)} />
        )}

        {/* CTA strip */}
        <Reveal style={{
          marginTop: '4rem',
          paddingTop: '3rem',
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: '1.375rem',
              fontWeight: 800,
              color: 'var(--panel-fg)',
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
            }}>
              {integrationSection.ctaHeading}
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--panel-fg-subtle)' }}>
              {integrationSection.ctaDescription}
            </div>
          </div>
          <Button
            as="a"
            href={integrationSection.ctaButtonLink}
            variant="primary"
            style={{ padding: '0.875rem 2.25rem', backgroundColor: 'var(--panel-accent-strong)', whiteSpace: 'nowrap' }}
          >
            {integrationSection.ctaButtonText}
          </Button>
        </Reveal>
          </>
        )}
      </div>

      <style>{`
        @keyframes anju-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  )
}
