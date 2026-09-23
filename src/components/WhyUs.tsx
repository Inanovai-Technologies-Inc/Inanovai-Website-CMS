import { useEffect, useState } from 'react'
import Reveal, { staggerDelay } from './motion/Reveal'
import Card from './motion/Card'

const WHY_US_ENDPOINT = 'http://localhost:1337/api/why-uses'
const WHY_US_SECTION_ENDPOINT = 'http://localhost:1337/api/why-us-section'

// Strapi caps a collection request at 25 by default; ask for more so newly
// added entries keep appearing without touching this file again.
const PAGE_SIZE = 100

type WhyUsEntry = {
  id: number
  documentId?: string
  category?: string
  title?: string
  body?: string
}

type StrapiCollectionResponse = {
  data?: WhyUsEntry[] | null
}

type Pillar = {
  key: string
  index: string
  category: string
  title: string
  body: string
}

function normalize(entry: WhyUsEntry, i: number): Pillar {
  return {
    key: entry.documentId ?? String(entry.id),
    index: String(i + 1).padStart(2, '0'),
    category: entry.category ?? '',
    title: entry.title ?? '',
    body: entry.body ?? '',
  }
}

const categoryColor: Record<string, string> = {
  AI: 'var(--accent)',
  ERP: 'var(--accent-warm)',
  Both: 'var(--muted-foreground)',
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
type WhyUsSectionFields = {
  eyebrow?: string
  headingLine1?: string
  headingLine2?: string
  description?: string
}

type WhyUsSectionEntry = WhyUsSectionFields & {
  id?: number
  documentId?: string
  attributes?: WhyUsSectionFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiWhyUsSectionResponse = {
  data?: WhyUsSectionEntry | WhyUsSectionEntry[] | null
}

function pickSectionEntry(data: StrapiWhyUsSectionResponse['data']): WhyUsSectionEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeSection(entry: WhyUsSectionEntry): WhyUsSectionFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

export default function WhyUs() {
  const [section, setSection] = useState<WhyUsSectionFields | null>(null)
  const [sectionLoading, setSectionLoading] = useState(true)
  const [sectionError, setSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSection() {
      try {
        const response = await fetch(WHY_US_SECTION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiWhyUsSectionResponse = await response.json()
        const entry = pickSectionEntry(payload.data)

        setSection(entry ? normalizeSection(entry) : null)
        setSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setSection(null)
        setSectionError(err instanceof Error ? err.message : 'Unable to reach the Why Us section API.')
      } finally {
        if (!controller.signal.aborted) setSectionLoading(false)
      }
    }

    loadSection()
    return () => controller.abort()
  }, [])

  const [pillars, setPillars] = useState<Pillar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPillars() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${WHY_US_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        // Rendered in the order the API returns them.
        setPillars(entries.map(normalize))
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setPillars([])
        setError(err instanceof Error ? err.message : 'Unable to reach the Why Us API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPillars()
    return () => controller.abort()
  }, [])

  return (
    <section
      id="why-us"
      style={{ backgroundColor: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="flex flex-col md:flex-row md:items-end gap-10 mb-16">
          <div className="flex-1">
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
          <div style={{ maxWidth: '28rem' }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[
                { label: 'AI-led', color: 'var(--accent)' },
                { label: 'ERP-led', color: 'var(--accent-warm)' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
              {sectionLoading ? '' : sectionError ? `Section content unavailable. ${sectionError}` : (section?.description ?? '')}
            </p>
          </div>
        </Reveal>

        {loading && <div style={statusStyle}>Loading Why Us entries…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load Why Us entries. {error}
          </div>
        )}

        {!loading && !error && pillars.length === 0 && (
          <div style={statusStyle}>No Why Us entries published yet.</div>
        )}

        {!loading && !error && pillars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.key} delay={staggerDelay(i)}>
                <Card style={{ padding: '2rem 2.25rem', height: '100%', backgroundColor: 'var(--background)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.125rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono-family)',
                      fontSize: '0.5625rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: colorFor(pillar.category),
                    }}>
                      {pillar.category}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>
                      {pillar.index}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display-family)',
                    fontSize: '1.0625rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--foreground)',
                    marginBottom: '0.625rem',
                    lineHeight: 1.25,
                  }}>
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--muted-foreground)' }}>
                    {pillar.body}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
