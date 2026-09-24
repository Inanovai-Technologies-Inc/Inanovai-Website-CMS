import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Reveal, { staggerDelay } from './motion/Reveal'
import { EASE } from './motion/ease'

const DEMOS_ENDPOINT = 'http://localhost:1337/api/demos'
const DEMO_SECTION_ENDPOINT = 'http://localhost:1337/api/demo-section'
const STRAPI_BASE_URL = 'http://localhost:1337'

// Strapi caps a collection request at 25 by default; ask for more so newly
// added demos keep appearing without touching this file again.
const PAGE_SIZE = 100

type StrapiMedia = {
  id?: number
  url?: string
}

type DemoEntry = {
  id: number
  documentId?: string
  title?: string
  category?: string
  duration?: string
  description?: string
  alt?: string
  // Field is capitalized "Image" in Strapi; "image" kept as a fallback.
  Image?: StrapiMedia[] | StrapiMedia | null
  image?: StrapiMedia[] | StrapiMedia | null
  // Single Media field, video-restricted. Optional — demos without a
  // recorded video link to Contact instead of pretending one exists.
  video?: StrapiMedia[] | StrapiMedia | null
}

type StrapiCollectionResponse = {
  data?: DemoEntry[] | null
}

type Demo = {
  key: string
  title: string
  category: string
  duration: string
  description: string
  img: string
  alt: string
  categoryColor: string
  videoUrl: string
}

// A handful of common direct video file extensions get a native <video>
// player; anything else (YouTube/Vimeo/Loom links, most likely in practice)
// is treated as an embeddable iframe URL.
function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

function firstMedia(value: StrapiMedia[] | StrapiMedia | null | undefined): StrapiMedia | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

// Strapi returns relative media URLs (e.g. "/uploads/x.png"); absolute URLs
// (an external image host) are passed through untouched.
function resolveMediaUrl(url: string | undefined): string {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `${STRAPI_BASE_URL}${url}`
}

// categoryColor isn't a Strapi field — it's inferred from the category text
// the same way the site already distinguishes AI work from ERP work.
function colorForCategory(category: string): string {
  if (category.startsWith('ERP')) return 'var(--accent-warm)'
  return 'var(--accent)'
}

function normalize(entry: DemoEntry): Demo {
  const media = firstMedia(entry.Image ?? entry.image)
  const videoMedia = firstMedia(entry.video)

  return {
    key: entry.documentId ?? String(entry.id),
    title: entry.title ?? '',
    category: entry.category ?? '',
    duration: entry.duration ?? '',
    description: entry.description ?? '',
    img: resolveMediaUrl(media?.url),
    alt: entry.alt ?? entry.title ?? '',
    categoryColor: colorForCategory(entry.category ?? ''),
    videoUrl: resolveMediaUrl(videoMedia?.url),
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

// ── Section header types ────────────────────────────────────────
type DemoSectionFields = {
  eyebrow?: string
  headingLine1?: string
  headingLine2?: string
  description?: string
}

type DemoSectionEntry = DemoSectionFields & {
  id?: number
  documentId?: string
  attributes?: DemoSectionFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiDemoSectionResponse = {
  data?: DemoSectionEntry | DemoSectionEntry[] | null
}

function pickSectionEntry(data: StrapiDemoSectionResponse['data']): DemoSectionEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeSection(entry: DemoSectionEntry): DemoSectionFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

// Arrow icon for demos that link to Contact instead of playing anything —
// visually distinct from the play triangle so the affordance is honest
// about what happens on click.
function RequestArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 2L11 7L3 12V2Z" fill="var(--accent)" />
    </svg>
  )
}

// Demo tiles are media-first (the thumbnail carries the visual weight), so
// they get the same elevation language as the content Card (radius-lg,
// shadow-sm → shadow-md, a small lift) without the bordered/padded shell
// that doesn't fit an edge-to-edge image.
//
// Tiles with a `videoUrl` (resolved from the Strapi `video` media field)
// open a real modal player. Tiles without one link to Contact instead of
// showing a play button that plays nothing.
function DemoTile({ demo, onPlay }: { demo: Demo; onPlay: (demo: Demo) => void }) {
  const shouldReduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const hasVideo = demo.videoUrl.length > 0

  const activate = () => {
    if (hasVideo) {
      onPlay(demo)
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }

  return (
    <motion.div
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={hasVideo ? `Play demo: ${demo.title}` : `Request a demo of: ${demo.title}`}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.25, ease: EASE }}
      style={{ outline: 'none' }}
    >
      <div
        className="relative overflow-hidden mb-4"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--muted)',
          aspectRatio: '16/9',
          boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transition: 'box-shadow 0.25s ease',
        }}
      >
        {demo.img && (
          <img
            src={demo.img}
            alt={demo.alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,15,0.38)' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'var(--background)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
            className="group-hover:scale-110 transition-transform duration-200"
          >
            {hasVideo ? <PlayIcon /> : <RequestArrowIcon />}
          </div>
        </div>
        {/* Duration */}
        <div style={{
          position: 'absolute',
          bottom: '0.75rem',
          right: '0.75rem',
          fontFamily: 'var(--font-mono-family)',
          fontSize: '0.625rem',
          letterSpacing: '0.08em',
          color: 'var(--on-media)',
          backgroundColor: 'rgba(0,0,0,0.65)',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius)',
        }}>
          {demo.duration}
        </div>
        {/* Category badge */}
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          left: '0.75rem',
          fontFamily: 'var(--font-mono-family)',
          fontSize: '0.5625rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--on-media)',
          backgroundColor: `color-mix(in srgb, ${demo.categoryColor} 80%, transparent)`,
          padding: '0.25rem 0.625rem',
          borderRadius: 'var(--radius)',
          fontWeight: 600,
        }}>
          {demo.category}
        </div>
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display-family)',
        fontSize: '1.0625rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--foreground)',
        marginBottom: '0.375rem',
      }}>
        {demo.title}
      </h3>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--muted-foreground)' }}>
        {demo.description}
      </p>
    </motion.div>
  )
}

// Real player, only rendered when a demo actually has a videoUrl. Escape
// and backdrop click both close it; body scroll is locked while open.
function VideoModal({ demo, onClose }: { demo: Demo; onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={demo.title}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'rgba(6, 6, 10, 0.85)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: EASE }}
        style={{ width: '100%', maxWidth: '960px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            style={{
              width: '2.25rem',
              height: '2.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          backgroundColor: '#000',
          aspectRatio: '16/9',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {isDirectVideoFile(demo.videoUrl) ? (
            <video src={demo.videoUrl} controls autoPlay className="w-full h-full" />
          ) : (
            <iframe
              src={demo.videoUrl}
              title={demo.title}
              className="w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DemoSection() {
  const [section, setSection] = useState<DemoSectionFields | null>(null)
  const [sectionLoading, setSectionLoading] = useState(true)
  const [sectionError, setSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSection() {
      try {
        const response = await fetch(DEMO_SECTION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiDemoSectionResponse = await response.json()
        const entry = pickSectionEntry(payload.data)

        setSection(entry ? normalizeSection(entry) : null)
        setSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setSection(null)
        setSectionError(err instanceof Error ? err.message : 'Unable to reach the demo section API.')
      } finally {
        if (!controller.signal.aborted) setSectionLoading(false)
      }
    }

    loadSection()
    return () => controller.abort()
  }, [])

  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDemos() {
      try {
        const query = new URLSearchParams({
          'populate': '*',
          'pagination[pageSize]': String(PAGE_SIZE),
        })
        const response = await fetch(`${DEMOS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        // Rendered in the order the API returns them.
        setDemos(entries.map(normalize))
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setDemos([])
        setError(err instanceof Error ? err.message : 'Unable to reach the demos API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDemos()
    return () => controller.abort()
  }, [])

  const [activeDemo, setActiveDemo] = useState<Demo | null>(null)

  return (
    <section id="demos" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
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
              {section?.eyebrow ?? ''}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--foreground)',
            }}>
              {section?.headingLine1 ?? ''}<br />{section?.headingLine2 ?? ''}
            </h2>
          </div>
          <p style={{ maxWidth: '26rem', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
            {sectionLoading ? '' : sectionError ? `Section content unavailable. ${sectionError}` : (section?.description ?? '')}
          </p>
        </Reveal>

        {loading && <div style={statusStyle}>Loading demos…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load demos. {error}
          </div>
        )}

        {!loading && !error && demos.length === 0 && (
          <div style={statusStyle}>No demos published yet.</div>
        )}

        {!loading && !error && demos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demos.map((demo, i) => (
              <Reveal key={demo.key} delay={staggerDelay(i)}>
                <DemoTile demo={demo} onPlay={setActiveDemo} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeDemo && <VideoModal demo={activeDemo} onClose={() => setActiveDemo(null)} />}
      </AnimatePresence>
    </section>
  )
}
