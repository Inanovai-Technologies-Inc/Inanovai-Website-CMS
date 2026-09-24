import { useEffect, useState } from 'react'
import Reveal, { staggerDelay } from './motion/Reveal'
import Card from './motion/Card'

const SERVICES_ENDPOINT = 'http://localhost:1337/api/services'
const SERVICE_SECTION_ENDPOINT = 'http://localhost:1337/api/service-section'

// Strapi caps a collection request at 25 by default; ask for more so newly
// added services keep appearing without touching this file again.
const PAGE_SIZE = 100

type ServiceEntry = {
  id: number
  documentId?: string
  title?: string
  category?: string
  description?: string
  tags?: string | string[] | null
  highlight?: boolean
  cta?: string
  href?: string
  slug?: string | null
}

type StrapiCollectionResponse = {
  data?: ServiceEntry[] | null
}

type Service = {
  key: string
  index: string
  title: string
  category: string
  description: string
  tags: string[]
  highlight: boolean
  cta: string
  href: string
}

function toTags(value: ServiceEntry['tags']): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return raw.map((tag) => tag.trim()).filter(Boolean)
}

// The card's call to action carries a trailing arrow in the design, but the
// stored value may or may not include one.
function toCta(value: string | undefined): string {
  const text = (value ?? 'Inquire').trim()
  return /[→>]$/.test(text) ? text : `${text} →`
}

function normalize(entry: ServiceEntry, i: number): Service {
  // A valid slug always wins: it routes to that service's own detail page
  // instead of falling back to the CMS's plain in-page `href`.
  const slug = entry.slug?.trim()

  return {
    key: entry.documentId ?? String(entry.id),
    index: String(i + 1).padStart(2, '0'),
    title: entry.title ?? '',
    category: entry.category ?? '',
    description: entry.description ?? '',
    tags: toTags(entry.tags),
    highlight: entry.highlight === true,
    cta: toCta(entry.cta),
    href: slug ? `/services/${slug}` : (entry.href ?? '#contact'),
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

// ── Section header types ────────────────────────────────────────
type ServiceSectionFields = {
  eyebrow?: string
  headingLine1?: string
  headingLine2?: string
  description?: string
}

type ServiceSectionEntry = ServiceSectionFields & {
  id?: number
  documentId?: string
  attributes?: ServiceSectionFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiServiceSectionResponse = {
  data?: ServiceSectionEntry | ServiceSectionEntry[] | null
}

function pickSectionEntry(data: StrapiServiceSectionResponse['data']): ServiceSectionEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeSection(entry: ServiceSectionEntry): ServiceSectionFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

type ServicesProps = {
  navigate: (to: string) => void
}

export default function Services({ navigate }: ServicesProps) {
  const [section, setSection] = useState<ServiceSectionFields | null>(null)
  const [sectionLoading, setSectionLoading] = useState(true)
  const [sectionError, setSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSection() {
      try {
        const response = await fetch(SERVICE_SECTION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiServiceSectionResponse = await response.json()
        const entry = pickSectionEntry(payload.data)

        setSection(entry ? normalizeSection(entry) : null)
        setSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setSection(null)
        setSectionError(err instanceof Error ? err.message : 'Unable to reach the service section API.')
      } finally {
        if (!controller.signal.aborted) setSectionLoading(false)
      }
    }

    loadSection()
    return () => controller.abort()
  }, [])

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadServices() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${SERVICES_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        // Rendered in the order the API returns them.
        setServices(entries.map(normalize))
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setServices([])
        setError(err instanceof Error ? err.message : 'Unable to reach the services API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadServices()
    return () => controller.abort()
  }, [])

  return (
    <section id="services" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
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
          <p style={{
            maxWidth: '28rem',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--muted-foreground)',
          }}>
            {sectionLoading ? '' : sectionError ? `Section content unavailable. ${sectionError}` : (section?.description ?? '')}
          </p>
        </Reveal>

        {loading && <div style={statusStyle}>Loading services…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load services. {error}
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div style={statusStyle}>No services published yet.</div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <Reveal key={service.key} delay={staggerDelay(i)}>
                <Card className="group" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Category + index row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono-family)',
                      fontSize: '0.5625rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: colorFor(service.category),
                      backgroundColor: `color-mix(in srgb, ${colorFor(service.category)} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${colorFor(service.category)} 25%, transparent)`,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '2px',
                    }}>
                      {service.category}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>
                      {service.index}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-display-family)',
                    fontSize: '1.1875rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--foreground)',
                    marginBottom: '0.75rem',
                    lineHeight: 1.25,
                  }}>
                    {service.title}
                  </h3>

                  <p style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: 'var(--muted-foreground)',
                    marginBottom: '1.5rem',
                  }}>
                    {service.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
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
                    <a
                      href={service.href}
                      onClick={(e) => {
                        // Single source of truth: whatever href is actually
                        // rendered on this anchor decides the click behavior,
                        // so the two can never diverge. A route (leading "/")
                        // always goes through client-side navigation instead
                        // of a full page load; anything else (an in-page
                        // "#anchor") keeps the browser's native behavior.
                        if (!service.href.startsWith('/')) return
                        e.preventDefault()
                        navigate(service.href)
                      }}
                      style={{
                        fontFamily: 'var(--font-mono-family)',
                        fontSize: '0.625rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.15s',
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseEnter={(e) => (e.currentTarget.style.color = colorFor(service.category))}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                    >
                      {service.cta}
                    </a>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
