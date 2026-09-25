import { useEffect, useRef, useState } from 'react'
import { STRAPI_URL } from '../config'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logoSrc from '../imports/image.png'
import { EASE } from './motion/ease'
import Button from './motion/Button'

const CHATBOT_ENDPOINT = `${STRAPI_URL}/api/chatbot`
const HISTORY_STORAGE_KEY = 'inanovai-chatbot-history'
const MAX_STORED_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000
const QUICK_SUGGESTIONS = ['Tell me about ANJU', 'Our services', 'Careers']

export type RoutePage = 'home' | 'careers' | 'blog-list' | 'blog-post' | 'about' | 'service-detail' | 'not-found'

type ChatRole = 'user' | 'assistant'
type ChatMessage = { role: ChatRole; content: string }

type ChatbotProps = {
  routePage: RoutePage
  blogSlug?: string | null
}

// Mirrors ScrollUI.tsx's section list so the chatbot knows which part of the
// single-page home route the visitor is scrolled to, without touching
// ScrollUI itself (that component doesn't render on standalone pages, but
// this widget needs to work everywhere).
const HOME_SECTIONS = ['hero', 'anju', 'services', 'why-us', 'demos', 'contact']

function getActiveHomeSection(): string {
  if (typeof document === 'undefined') return 'hero'

  for (let i = HOME_SECTIONS.length - 1; i >= 0; i--) {
    const el = document.getElementById(HOME_SECTIONS[i])
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) return HOME_SECTIONS[i]
  }

  return 'hero'
}

function useActiveHomeSection(enabled: boolean): string {
  const [section, setSection] = useState(getActiveHomeSection)

  useEffect(() => {
    if (!enabled) return

    const onScroll = () => {
      setSection(getActiveHomeSection())
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled])

  return section
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((m): m is ChatMessage => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
  } catch {
    // sessionStorage unavailable (private mode, storage full, etc.) — history just won't persist.
  }
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function LauncherIcon() {
  return (
    <span aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem', display: 'block', position: 'relative', overflow: 'hidden' }}>
      <img
        src={logoSrc}
        alt=""
        style={{ position: 'absolute', top: '0.25rem', left: '0.05rem', width: '8.7rem', height: '2rem', maxWidth: 'none', objectFit: 'fill', mixBlendMode: 'multiply' }}
      />
    </span>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.2rem 0' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--muted-foreground)' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p style={{ margin: '0 0 0.6rem' }}>{children}</p>,
        h1: ({ children }) => <h1 style={{ margin: '0 0 0.6rem', fontSize: '1.05em', lineHeight: 1.3 }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ margin: '0 0 0.6rem', fontSize: '1em', lineHeight: 1.3 }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95em', lineHeight: 1.3 }}>{children}</h3>,
        ul: ({ children }) => <ul style={{ margin: '0 0 0.6rem', paddingLeft: '1.25rem' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '0 0 0.6rem', paddingLeft: '1.25rem' }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: '0.2rem 0' }}>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote style={{ margin: '0 0 0.6rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--border)', color: 'var(--muted-foreground)' }}>
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code style={{ padding: '0.1rem 0.25rem', borderRadius: '3px', backgroundColor: 'var(--border)', fontFamily: 'var(--font-mono-family)', fontSize: '0.9em' }}>
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// Site-wide chat widget: mounted once in App.tsx so it persists identically
// across every route. It never talks to Strapi's content APIs or the AI
// provider directly — only to the one custom /api/chatbot route, which
// holds the AI key server-side and grounds answers in live CMS content.
export default function Chatbot({ routePage, blogSlug }: ChatbotProps) {
  const shouldReduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory())
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousContextKeyRef = useRef<string | null>(null)
  const contextVersionRef = useRef(0)

  const homeSection = useActiveHomeSection(routePage === 'home')
  const contextKey = routePage === 'home' ? `home:${homeSection}` : `${routePage}:${blogSlug ?? ''}`

  useEffect(() => {
    if (previousContextKeyRef.current === null) {
      previousContextKeyRef.current = contextKey
      return
    }

    if (previousContextKeyRef.current !== contextKey) {
      previousContextKeyRef.current = contextKey
      contextVersionRef.current += 1
      setMessages([])
      setInput('')
      setSending(false)
      saveHistory([])
    }
  }, [contextKey])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: shouldReduceMotion ? 'auto' : 'smooth' })
  }, [messages, sending, shouldReduceMotion])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function buildPageContext() {
    if (routePage === 'blog-post') return { page: 'blog-post' as const, slug: blogSlug ?? '' }
    if (routePage === 'home') return { page: 'home' as const, section: homeSection }
    return { page: routePage }
  }

  async function sendMessage() {
    const trimmed = input.trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!trimmed || sending) return

    const historyForRequest = messages.slice(-10)
    const nextMessages = [...messages, { role: 'user', content: trimmed } as ChatMessage]
    setMessages(nextMessages)
    saveHistory(nextMessages)
    setInput('')
    setSending(true)
    const requestContextVersion = contextVersionRef.current

    try {
      const response = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, pageContext: buildPageContext(), history: historyForRequest }),
      })
      if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)
      if (requestContextVersion !== contextVersionRef.current) return

      const payload: { reply?: string } = await response.json()
      const reply = payload.reply?.trim() || "Sorry, I couldn't come up with a response. Could you try rephrasing that?"
      const withReply = [...nextMessages, { role: 'assistant', content: reply } as ChatMessage]
      setMessages(withReply)
      saveHistory(withReply)
    } catch {
      if (requestContextVersion !== contextVersionRef.current) return
      const withError = [
        ...nextMessages,
        { role: 'assistant', content: "I'm having trouble responding right now. Please try again in a moment, or use the contact form." } as ChatMessage,
      ]
      setMessages(withError)
      saveHistory(withError)
    } finally {
      if (requestContextVersion === contextVersionRef.current) setSending(false)
    }
  }

  function clearConversation() {
    setMessages([])
    saveHistory([])
  }

  function chooseSuggestion(suggestion: string) {
    setInput(suggestion)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div style={{ position: 'fixed', right: 'clamp(0.75rem, 3vw, 1.5rem)', bottom: 'clamp(0.75rem, 3vw, 1.5rem)', zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.625rem' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label="Inanovai website assistant"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: EASE }}
            style={{
              width: 'min(400px, calc(100vw - 1.5rem))',
              height: 'min(580px, calc(100vh - 6.5rem))',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--card)',
              border: '1px solid color-mix(in srgb, var(--accent) 18%, var(--border))',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(110deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card) 62%, color-mix(in srgb, var(--accent-warm-end) 7%, var(--card)))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <img
                  src={logoSrc}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '3.1rem',
                    height: '2.35rem',
                    objectFit: 'contain',
                  }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-display-family)', fontSize: '0.875rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--foreground)' }}>ANJU Guide</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearConversation}
                    aria-label="Clear conversation"
                    style={{
                      fontFamily: 'var(--font-mono-family)',
                      fontSize: '0.625rem',
                      letterSpacing: '0.04em',
                      color: 'var(--muted-foreground)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.375rem 0.5rem',
                      transition: 'color 0.2s ease, background-color 0.2s ease',
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: 'none',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease, background-color 0.2s ease',
                  }}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', background: 'color-mix(in srgb, var(--background) 35%, var(--card))' }}>
              {messages.length === 0 && (
                <div style={{ padding: '0.25rem 0.125rem', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--muted-foreground)' }}>
                  <div>Ask me about ANJU, our services, careers, blog articles, or how to get in touch.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                    {QUICK_SUGGESTIONS.map((suggestion) => (
                      <motion.button
                        key={suggestion}
                        type="button"
                        onClick={() => chooseSuggestion(suggestion)}
                        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                        transition={{ duration: 0.16, ease: EASE }}
                        style={{
                          padding: '0.38rem 0.55rem',
                          border: '1px solid color-mix(in srgb, var(--accent) 28%, var(--border))',
                          borderRadius: 'var(--radius)',
                          background: 'color-mix(in srgb, var(--accent) 6%, var(--card))',
                          color: 'var(--accent)',
                          fontFamily: 'var(--font-body-family)',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
                  style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '0.5rem 0.7rem',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                      lineHeight: 1.5,
                      whiteSpace: m.role === 'user' ? 'pre-wrap' : undefined,
                      background: m.role === 'user' ? 'linear-gradient(135deg, var(--accent-strong), color-mix(in srgb, var(--accent-strong) 78%, var(--accent-warm-end)))' : 'var(--card)',
                      color: m.role === 'user' ? 'var(--accent-foreground)' : 'var(--foreground)',
                      border: m.role === 'user' ? '1px solid transparent' : '1px solid var(--border)',
                      boxShadow: m.role === 'user' ? '0 3px 10px color-mix(in srgb, var(--accent) 16%, transparent)' : 'var(--shadow-sm)',
                    }}
                  >
                    {m.role === 'assistant' ? <MarkdownMessage content={m.content} /> : m.content}
                  </div>
                </motion.div>
              ))}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '0.5rem 0.7rem', borderRadius: '10px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              style={{ display: 'flex', gap: '0.4rem', padding: '0.625rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
            >
              <motion.input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Message"
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={sending}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-body-family)',
                  fontSize: '0.8125rem',
                  padding: '0.55rem 0.7rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--panel-input, var(--background))',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
                whileFocus={shouldReduceMotion ? undefined : { scale: 1.01, borderColor: 'var(--accent)' }}
                transition={{ duration: 0.18, ease: EASE }}
              />
              <Button as="button" type="submit" variant="primary" aria-label="Send message" style={{ minWidth: '2.25rem', padding: '0.55rem 0.65rem', borderRadius: 'var(--radius)' }}>
                <SendIcon />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, x: 8 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
            style={{
              position: 'absolute',
              right: '4.2rem',
              bottom: '0.65rem',
              width: 'max-content',
              maxWidth: 'calc(100vw - 6rem)',
              padding: '0.45rem 0.65rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'var(--font-body-family)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          >
            Need help? Ask ANJU
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.03 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
        animate={shouldReduceMotion || open ? undefined : { y: [0, -3, 0], boxShadow: ['var(--shadow-lg), 0 0 0 5px color-mix(in srgb, var(--accent) 8%, transparent)', 'var(--shadow-lg), 0 0 0 8px color-mix(in srgb, var(--accent-warm) 13%, transparent)', 'var(--shadow-lg), 0 0 0 5px color-mix(in srgb, var(--accent) 8%, transparent)'] }}
        transition={shouldReduceMotion ? undefined : { duration: 3.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          border: '1px solid color-mix(in srgb, var(--accent-foreground) 35%, transparent)',
          background: 'linear-gradient(145deg, var(--accent-strong) 12%, var(--accent) 58%, var(--accent-warm-end))',
          color: 'var(--accent-foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg), 0 0 0 5px color-mix(in srgb, var(--accent) 8%, transparent)',
          cursor: 'pointer',
        }}
      >
        {open ? <CloseIcon /> : <LauncherIcon />}
      </motion.button>
    </div>
  )
}
