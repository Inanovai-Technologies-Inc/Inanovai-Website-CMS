import { useEffect, useState } from 'react'
import Reveal, { staggerDelay } from './motion/Reveal'
import Card from './motion/Card'
import Button from './motion/Button'

const CAREERS_ENDPOINT = 'http://localhost:1337/api/careers'
const CAREER_SECTION_ENDPOINT = 'http://localhost:1337/api/career-section'

// Strapi pages collections (25 per request by default), so every page is walked.
const PAGE_SIZE = 100
const MAX_PAGES = 50

type RichTextNode = {
  type?: string
  text?: string
  children?: RichTextNode[]
}

type RichText = string | RichTextNode[] | null

type CareerFields = {
  title?: string
  location?: string
  employmentType?: string
  experience?: string
  description?: string
  skills?: string | string[] | null
  requirements?: RichText
  responsibilities?: RichText
  applicationLink?: string | null
  isActive?: boolean
}

type CareerEntry = CareerFields & {
  id: number
  documentId?: string
  attributes?: CareerFields
}

// ── Section header types ────────────────────────────────────────
type CareerSectionFields = {
  eyebrow?: string
  heading?: string
  description?: string
}

type CareerSectionEntry = CareerSectionFields & {
  id?: number
  documentId?: string
  attributes?: CareerSectionFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiCareerSectionResponse = {
  data?: CareerSectionEntry | CareerSectionEntry[] | null
}

function pickSectionEntry(data: StrapiCareerSectionResponse['data']): CareerSectionEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeSection(entry: CareerSectionEntry): CareerSectionFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

type StrapiCollectionResponse = {
  data?: CareerEntry[] | null
  meta?: {
    pagination?: {
      page?: number
      pageCount?: number
      total?: number
    }
  }
}

type Career = {
  key: string
  title: string
  location: string
  employmentType: string
  experience: string
  description: string
  skills: string[]
  requirements: string[]
  responsibilities: string[]
  applicationLink: string
}

function nodeText(node: RichTextNode): string {
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('')
  return ''
}

function toLines(value: RichText): string[] {
  const raw = typeof value === 'string'
    ? value.split('\n')
    : Array.isArray(value)
      ? value.map(nodeText)
      : []

  return raw
    .map((line) => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean)
}

function toSkills(value: CareerFields['skills']): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return raw.map((skill) => skill.trim()).filter(Boolean)
}

function normalize(entry: CareerEntry): Career {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  const fields: CareerFields = entry.attributes ?? entry

  return {
    key: entry.documentId ?? String(entry.id),
    title: fields.title ?? 'Open Position',
    location: fields.location ?? '',
    employmentType: fields.employmentType ?? '',
    experience: fields.experience ?? '',
    description: fields.description ?? '',
    skills: toSkills(fields.skills),
    requirements: toLines(fields.requirements ?? null),
    responsibilities: toLines(fields.responsibilities ?? null),
    applicationLink: fields.applicationLink ?? '',
  }
}

function isActive(entry: CareerEntry): boolean {
  return (entry.attributes ?? entry).isActive === true
}

async function fetchAllCareers(signal: AbortSignal): Promise<CareerEntry[]> {
  const entries: CareerEntry[] = []
  let page = 1
  let pageCount = 1

  while (page <= pageCount && page <= MAX_PAGES) {
    const query = new URLSearchParams({
      'sort': 'createdAt:desc',
      'pagination[page]': String(page),
      'pagination[pageSize]': String(PAGE_SIZE),
    })

    const response = await fetch(`${CAREERS_ENDPOINT}?${query}`, { signal })
    if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

    const payload: StrapiCollectionResponse = await response.json()
    if (Array.isArray(payload.data)) entries.push(...payload.data)

    pageCount = payload.meta?.pagination?.pageCount ?? 1
    page += 1
  }

  return entries
}

const eyebrowStyle = {
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
} as const

const metaStyle = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.625rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
} as const

const listLabelStyle = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.5625rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
  fontWeight: 600,
  marginBottom: '0.625rem',
} as const

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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
    >
      <path d="M2.5 4.5L6 8L9.5 4.5" />
    </svg>
  )
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div>
      <div style={listLabelStyle}>{label}</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--muted-foreground)',
              display: 'flex',
              gap: '0.625rem',
            }}
          >
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function JobCard({ career }: { career: Career }) {
  const [open, setOpen] = useState(false)
  const hasDetails = career.responsibilities.length > 0 || career.requirements.length > 0
  const detailsId = `career-details-${career.key}`

  return (
    <Card as="article">
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem' }}>
            {career.employmentType && (
              <span style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.5625rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--accent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                padding: '0.2rem 0.6rem',
                borderRadius: '2px',
              }}>
                {career.employmentType}
              </span>
            )}
            {career.experience && <span style={metaStyle}>{career.experience}</span>}
          </div>

          <h3 style={{
            fontFamily: 'var(--font-display-family)',
            fontSize: '1.1875rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--foreground)',
            lineHeight: 1.25,
            marginBottom: '0.5rem',
          }}>
            {career.title}
          </h3>

          {career.location && <div style={metaStyle}>{career.location}</div>}
        </div>

        {career.description && (
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
            {career.description}
          </p>
        )}

        {career.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {career.skills.map((skill) => (
              <span key={skill} style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.5625rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius)',
              }}>
                {skill}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {career.applicationLink ? (
            <Button
              as="a"
              href={career.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}
            >
              Apply Now
            </Button>
          ) : (
            <Button as="a" href="#contact" variant="primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}>
              Apply Now
            </Button>
          )}

          {hasDetails && (
            <Button
              as="button"
              type="button"
              variant="secondary"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls={detailsId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.625rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 500,
                padding: '0.5rem 1rem',
              }}
            >
              {open ? 'Hide Details' : 'View Details'}
              <ChevronIcon open={open} />
            </Button>
          )}
        </div>
      </div>

      {hasDetails && open && (
        <div
          id={detailsId}
          style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--muted)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <DetailList label="Responsibilities" items={career.responsibilities} />
          <DetailList label="Requirements" items={career.requirements} />
        </div>
      )}
    </Card>
  )
}

export default function Careers() {
  const [section, setSection] = useState<CareerSectionFields | null>(null)
  const [sectionLoading, setSectionLoading] = useState(true)
  const [sectionError, setSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSection() {
      try {
        const response = await fetch(CAREER_SECTION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCareerSectionResponse = await response.json()
        const entry = pickSectionEntry(payload.data)

        setSection(entry ? normalizeSection(entry) : null)
        setSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setSection(null)
        setSectionError(err instanceof Error ? err.message : 'Unable to reach the career section API.')
      } finally {
        if (!controller.signal.aborted) setSectionLoading(false)
      }
    }

    loadSection()
    return () => controller.abort()
  }, [])

  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCareers() {
      try {
        const entries = await fetchAllCareers(controller.signal)

        setCareers(entries.filter(isActive).map(normalize))
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setCareers([])
        setError(err instanceof Error ? err.message : 'Unable to reach the careers service.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadCareers()
    return () => controller.abort()
  }, [])

  return (
    <section id="careers" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div style={eyebrowStyle}>
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
              {section?.heading ?? ''}
            </h2>
          </div>
          <p style={{ maxWidth: '26rem', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
            {sectionLoading ? '' : sectionError ? `Section content unavailable. ${sectionError}` : (section?.description ?? '')}
          </p>
        </Reveal>

        {loading && <div style={statusStyle}>Loading open positions…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load open positions. {error}
          </div>
        )}

        {!loading && !error && careers.length === 0 && (
          <div style={statusStyle}>
            No open positions right now — write to us anyway and we will keep you in mind.
          </div>
        )}

        {!loading && !error && careers.length === 1 && (
          <div className="flex justify-center">
            <div style={{ width: '100%', maxWidth: '22rem' }}>
              <Reveal>
                <JobCard career={careers[0]} />
              </Reveal>
            </div>
          </div>
        )}

        {!loading && !error && careers.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
            {careers.map((career, i) => (
              <Reveal key={career.key} delay={staggerDelay(i)}>
                <JobCard career={career} />
              </Reveal>
            ))}
          </div>
        )}

        {!loading && !error && careers.length > 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {careers.map((career, i) => (
              <Reveal key={career.key} delay={staggerDelay(i)}>
                <JobCard career={career} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
