import { useEffect, useState } from 'react'
import { STRAPI_URL } from '../config'
import Reveal, { staggerDelay } from './motion/Reveal'
import Card from './motion/Card'

const GOVERNANCE_SECTION_ENDPOINT = `${STRAPI_URL}/api/governance-section`
const GOVERNANCE_TOPICS_ENDPOINT = `${STRAPI_URL}/api/governance-topics`

// Strapi caps a collection request at 25 by default; ask for more so newly
// added topics keep appearing without touching this file again.
const PAGE_SIZE = 100

type GovernanceSectionFields = {
  eyebrow?: string
  heading?: string
  description?: string
}

type GovernanceSectionEntry = GovernanceSectionFields & {
  id?: number
  documentId?: string
  attributes?: GovernanceSectionFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiGovernanceSectionResponse = {
  data?: GovernanceSectionEntry | GovernanceSectionEntry[] | null
}

function pickSectionEntry(data: StrapiGovernanceSectionResponse['data']): GovernanceSectionEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeSection(entry: GovernanceSectionEntry): GovernanceSectionFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

type GovernanceTopicEntry = {
  id: number
  documentId?: string
  title?: string
  body?: string
  displayOrder?: number
}

type StrapiTopicsResponse = {
  data?: GovernanceTopicEntry[] | null
}

type Topic = {
  key: string
  title: string
  body: string
  displayOrder: number
}

function normalize(entry: GovernanceTopicEntry, i: number): Topic {
  return {
    key: entry.documentId ?? String(entry.id),
    title: entry.title ?? '',
    body: entry.body ?? '',
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

export default function Governance() {
  const [section, setSection] = useState<GovernanceSectionFields | null>(null)
  const [sectionLoading, setSectionLoading] = useState(true)
  const [sectionError, setSectionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSection() {
      try {
        const response = await fetch(GOVERNANCE_SECTION_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiGovernanceSectionResponse = await response.json()
        const entry = pickSectionEntry(payload.data)

        setSection(entry ? normalizeSection(entry) : null)
        setSectionError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setSection(null)
        setSectionError(err instanceof Error ? err.message : 'Unable to reach the Governance section API.')
      } finally {
        if (!controller.signal.aborted) setSectionLoading(false)
      }
    }

    loadSection()
    return () => controller.abort()
  }, [])

  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadTopics() {
      try {
        const query = new URLSearchParams({ 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${GOVERNANCE_TOPICS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiTopicsResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        // Editors control the sequence via displayOrder, not API return order.
        const sorted = entries
          .map(normalize)
          .sort((a, b) => a.displayOrder - b.displayOrder)

        setTopics(sorted)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setTopics([])
        setError(err instanceof Error ? err.message : 'Unable to reach the Governance topics API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadTopics()
    return () => controller.abort()
  }, [])

  return (
    <section
      id="governance"
      style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}
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
              {section?.heading ?? ''}
            </h2>
          </div>
          <div style={{ maxWidth: '28rem' }}>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
              {sectionLoading ? '' : sectionError ? `Section content unavailable. ${sectionError}` : (section?.description ?? '')}
            </p>
          </div>
        </Reveal>

        {loading && <div style={statusStyle}>Loading governance topics…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load governance topics. {error}
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div style={statusStyle}>No governance topics published yet.</div>
        )}

        {!loading && !error && topics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topics.map((topic, i) => (
              <Reveal key={topic.key} delay={staggerDelay(i)}>
                <Card style={{ padding: '2rem', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1.125rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>
                      {String(i + 1).padStart(2, '0')}
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
                    {topic.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--muted-foreground)' }}>
                    {topic.body}
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
