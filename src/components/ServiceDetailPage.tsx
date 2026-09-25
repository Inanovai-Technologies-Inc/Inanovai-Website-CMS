import { useEffect, useState } from 'react'
import { STRAPI_URL } from '../config'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from './motion/ease'
import Reveal, { staggerDelay } from './motion/Reveal'
import Card from './motion/Card'

const SERVICES_ENDPOINT = `${STRAPI_URL}/api/services`
const STRAPI_BASE_URL = STRAPI_URL

type StrapiMedia = {
  id?: number
  url?: string
  formats?: {
    large?: { url?: string }
    medium?: { url?: string }
  }
}

type ServiceFeature = {
  title?: string
  description?: string
}

type ServiceEntry = {
  id: number
  documentId?: string
  title?: string
  category?: string
  description?: string
  detailedDescription?: string
  tags?: string | string[] | null
  slug?: string
  features?: ServiceFeature[] | null
  // Strapi field is capitalized ("Image") — matching the live schema as-is.
  Image?: StrapiMedia[] | StrapiMedia | null
}

type StrapiCollectionResponse = {
  data?: ServiceEntry[] | null
}

type Feature = { key: string; title: string; description: string }

type ServiceDetail = {
  title: string
  category: string
  description: string
  detailedDescription: string
  tags: string[]
  imageUrl: string
  features: Feature[]
}

function toTags(value: ServiceEntry['tags']): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return raw.map((tag) => tag.trim()).filter(Boolean)
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

function resolveImageUrl(media: StrapiMedia | null): string {
  if (!media) return ''
  return resolveMediaUrl(media.formats?.large?.url ?? media.formats?.medium?.url ?? media.url)
}

function normalizeFeature(feature: ServiceFeature, i: number): Feature {
  return {
    key: String(i),
    title: feature.title ?? '',
    description: feature.description ?? '',
  }
}

function normalize(entry: ServiceEntry): ServiceDetail {
  return {
    title: entry.title ?? '',
    category: entry.category ?? '',
    description: entry.description ?? '',
    detailedDescription: entry.detailedDescription ?? '',
    tags: toTags(entry.tags),
    imageUrl: resolveImageUrl(firstMedia(entry.Image)),
    features: Array.isArray(entry.features) ? entry.features.map(normalizeFeature) : [],
  }
}

const categoryColor: Record<string, string> = {
  AI: 'var(--accent)',
  ERP: 'var(--accent-warm)',
}

const colorFor = (category: string) => categoryColor[category] ?? 'var(--muted-foreground)'

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

const bodyTextStyle = {
  fontSize: '1.0625rem',
  lineHeight: 1.85,
  color: 'var(--muted-foreground)',
} as const

// The homepage sections above #services (Hero, ANJU) each fetch their own
// Strapi content independently, so the page's height keeps changing for a
// while after it first mounts — a single scroll right after navigate('/')
// can land short, on whatever (much shorter) loading-skeleton layout exists
// at that instant. Scrolling immediately once the section exists, then
// re-checking and re-snapping a few times as that content finishes loading,
// corrects for shifts without needing to know exactly when every fetch above
// it resolves.
function scrollToSectionWhenReady(id: string, reduceMotion: boolean) {
  const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'

  function snap(el: HTMLElement) {
    if (Math.abs(el.getBoundingClientRect().top) > 2) {
      el.scrollIntoView({ behavior, block: 'start' })
    }
  }

  function waitForElement(attempts: number) {
    const el = document.getElementById(id)
    if (!el) {
      if (attempts < 90) requestAnimationFrame(() => waitForElement(attempts + 1))
      return
    }

    snap(el)
    ;[300, 700, 1200, 2000].forEach((delay) => {
      window.setTimeout(() => snap(el), delay)
    })
  }

  requestAnimationFrame(() => waitForElement(0))
}

type ServiceDetailPageProps = {
  slug: string
  navigate: (to: string) => void
}

// A reusable detail page for any Service entry that has a slug — currently
// only "ANJU — AI Copilot" has one (see Services.tsx: cards without a slug
// keep using their existing in-page anchor instead of routing here).
export default function ServiceDetailPage({ slug, navigate }: ServiceDetailPageProps) {
  const shouldReduceMotion = useReducedMotion()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadService() {
      try {
        const query = new URLSearchParams({ 'filters[slug][$eq]': slug, populate: '*' })
        const response = await fetch(`${SERVICES_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setService(entries[0] ? normalize(entries[0]) : null)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setService(null)
        setError(err instanceof Error ? err.message : 'Unable to reach the services API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadService()
    return () => controller.abort()
  }, [slug])

  const backToServices = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/')
    scrollToSectionWhenReady('services', Boolean(shouldReduceMotion))
  }

  return (
    <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <a
          href="/#services"
          onClick={backToServices}
          style={{
            fontFamily: 'var(--font-mono-family)',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2.5rem',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
        >
          ← Back to services
        </a>

        {loading && <div style={statusStyle}>Loading service…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load this service. {error}
          </div>
        )}

        {!loading && !error && !service && (
          <div style={statusStyle}>Service not found.</div>
        )}

        {!loading && !error && service && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start" style={{ marginBottom: '3.5rem' }}>
              <div>
                {service.category && (
                  <div style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-mono-family)',
                    fontSize: '0.625rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: colorFor(service.category),
                    backgroundColor: `color-mix(in srgb, ${colorFor(service.category)} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${colorFor(service.category)} 25%, transparent)`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '2px',
                    marginBottom: '1.25rem',
                  }}>
                    {service.category}
                  </div>
                )}

                <h1 style={{
                  fontFamily: 'var(--font-display-family)',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'var(--foreground)',
                  marginBottom: '1.25rem',
                }}>
                  {service.title}
                </h1>

                {service.description && (
                  <p style={{
                    fontFamily: 'var(--font-body-family)',
                    fontSize: '1.1875rem',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    letterSpacing: '-0.005em',
                    color: 'var(--foreground)',
                    marginBottom: '1.5rem',
                  }}>
                    {service.description}
                  </p>
                )}

                {service.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {service.tags.map((tag) => (
                      <span key={tag} style={{
                        fontFamily: 'var(--font-mono-family)',
                        fontSize: '0.5625rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {service.imageUrl && (
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--muted)',
                  aspectRatio: '16/9',
                  boxShadow: 'var(--shadow-lg)',
                }}>
                  <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {service.detailedDescription && (
              <p style={{ ...bodyTextStyle, maxWidth: '48rem', marginBottom: service.features.length > 0 ? '3.5rem' : '3rem' }}>
                {service.detailedDescription}
              </p>
            )}

            {service.features.length > 0 && (
              <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {service.features.map((feature, i) => (
                  <Reveal key={feature.key} delay={staggerDelay(i)}>
                    <Card style={{ padding: '2rem', height: '100%' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-display-family)',
                        fontSize: '1.0625rem',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: 'var(--foreground)',
                        marginBottom: '0.625rem',
                        lineHeight: 1.25,
                      }}>
                        {feature.title}
                      </h3>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
                        {feature.description}
                      </p>
                    </Card>
                  </Reveal>
                ))}
              </Reveal>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
