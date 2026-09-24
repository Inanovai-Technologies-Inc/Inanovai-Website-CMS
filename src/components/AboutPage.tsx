import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import Reveal from './motion/Reveal'
import Card from './motion/Card'

const ABOUT_ENDPOINT = 'http://localhost:1337/api/about'
const TEAM_MEMBERS_ENDPOINT = 'http://localhost:1337/api/team-members'
const STRAPI_BASE_URL = 'http://localhost:1337'

// Strapi caps a collection request at 25 by default; ask for more so newly
// added team members keep appearing without touching this file again.
const PAGE_SIZE = 100

// ── Strapi Blocks rich-text rendering ───────────────────────────
// Duplicated from BlogPostPage.tsx rather than shared, matching this
// codebase's existing convention of keeping each page's Strapi wiring
// self-contained instead of introducing a shared module.
type RichTextNode = {
  type?: string
  level?: number
  format?: 'ordered' | 'unordered'
  url?: string
  text?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  children?: RichTextNode[]
}

type RichText = string | RichTextNode[] | null | undefined

const bodyTextStyle = {
  fontSize: '1.0625rem',
  lineHeight: 1.85,
  color: 'var(--muted-foreground)',
  margin: '0 0 1.25rem',
} as const

const HEADING_SIZES: Record<number, string> = {
  1: '2rem',
  2: '1.625rem',
  3: '1.3125rem',
  4: '1.125rem',
  5: '1rem',
  6: '0.9375rem',
}

function renderInline(node: RichTextNode, key: React.Key): ReactNode {
  if (node.type === 'link' && node.url) {
    return (
      <a
        key={key}
        href={node.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--accent)', textDecoration: 'underline' }}
      >
        {(node.children ?? []).map((child, i) => renderInline(child, i))}
      </a>
    )
  }

  let content: ReactNode = node.text ?? ''
  if (node.code) {
    content = (
      <code style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.875em', backgroundColor: 'var(--muted)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
        {content}
      </code>
    )
  }
  if (node.bold) content = <strong>{content}</strong>
  if (node.italic) content = <em>{content}</em>
  if (node.underline) content = <u>{content}</u>
  if (node.strikethrough) content = <s>{content}</s>

  return <span key={key}>{content}</span>
}

function renderBlock(node: RichTextNode, key: React.Key): ReactNode {
  const children = node.children ?? []

  switch (node.type) {
    case 'heading': {
      const level = Math.min(Math.max(node.level ?? 2, 1), 6)
      const Tag = `h${level}` as ElementType
      return (
        <Tag key={key} style={{
          fontFamily: 'var(--font-display-family)',
          fontSize: HEADING_SIZES[level],
          fontWeight: 800,
          color: 'var(--foreground)',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          marginTop: '1.75rem',
          marginBottom: '0.75rem',
        }}>
          {children.map((child, i) => renderInline(child, i))}
        </Tag>
      )
    }
    case 'list': {
      const Tag = node.format === 'ordered' ? 'ol' : 'ul'
      return (
        <Tag key={key} style={{ margin: '0 0 1.25rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {children.map((child, i) => renderBlock(child, i))}
        </Tag>
      )
    }
    case 'list-item':
      return (
        <li key={key} style={{ fontSize: '1.0625rem', lineHeight: 1.8, color: 'var(--muted-foreground)' }}>
          {children.map((child, i) => renderInline(child, i))}
        </li>
      )
    case 'quote':
      return (
        <blockquote key={key} style={{
          position: 'relative',
          margin: '2rem 0',
          padding: '1.5rem 1.75rem',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
          backgroundColor: 'var(--muted)',
          fontFamily: 'var(--font-display-family)',
          fontSize: '1.1875rem',
          fontWeight: 500,
          lineHeight: 1.6,
          letterSpacing: '-0.01em',
          color: 'var(--foreground)',
          fontStyle: 'italic',
        }}>
          {children.map((child, i) => renderInline(child, i))}
        </blockquote>
      )
    case 'code':
      return (
        <pre key={key} style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', overflowX: 'auto', margin: '1.5rem 0' }}>
          <code style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.85rem', color: 'var(--foreground)' }}>
            {children.map((child, i) => renderInline(child, i))}
          </code>
        </pre>
      )
    case 'paragraph':
    default:
      return (
        <p key={key} style={bodyTextStyle}>
          {children.map((child, i) => renderInline(child, i))}
        </p>
      )
  }
}

function renderRichText(content: RichText): ReactNode {
  if (!content) return null

  if (typeof content === 'string') {
    return content.split(/\n{2,}/).map((paragraph, i) => (
      <p key={i} style={{ ...bodyTextStyle, whiteSpace: 'pre-line' }}>{paragraph}</p>
    ))
  }

  return content.map((node, i) => renderBlock(node, i))
}

// ── About fields ─────────────────────────────────────────────────
// whatWeDoTitle/approachTitle/whyInanovaiTitle/cta* are still fetched (part
// of the same Strapi entry) but intentionally not rendered — "Our Expertise"
// and "Our Approach"/"Why Inanovai" are deliberately excluded per the
// current page structure (Why Us already covers that ground on its own
// page), and the closing CTA band was removed since the navbar's "Book a
// Call" and the global footer already cover that.
type AboutFields = {
  heroEyebrow?: string
  heroTitle?: string
  heroDescription?: string
  whoWeAreTitle?: string
  whoWeAreDescription?: RichText
  whatWeDoTitle?: string
  whatWeDoDescription?: string
  approachTitle?: string
  approachDescription?: string
  whyInanovaiTitle?: string
  whyInanovaiDescription?: string
  teamTitle?: string
  teamDescription?: string
  ctaTitle?: string
  ctaDescription?: string
  ctaButtonText?: string
}

type AboutEntry = AboutFields & {
  id?: number
  documentId?: string
  attributes?: AboutFields
}

// Strapi v5 single types return data as a flat object; tolerate a
// collection-type array shape too in case that ever changes again.
type StrapiAboutResponse = {
  data?: AboutEntry | AboutEntry[] | null
}

function pickEntry(data: StrapiAboutResponse['data']): AboutEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalize(entry: AboutEntry): AboutFields {
  return entry.attributes ?? entry
}

// ── Team members ─────────────────────────────────────────────────
type StrapiMedia = {
  id?: number
  url?: string
  formats?: {
    thumbnail?: { url?: string }
    small?: { url?: string }
  }
}

type TeamMemberEntry = {
  id: number
  documentId?: string
  name?: string
  role?: string
  shortBio?: string
  photo?: StrapiMedia[] | StrapiMedia | null
  linkedinUrl?: string
  displayOrder?: number | null
}

type StrapiTeamMembersResponse = {
  data?: TeamMemberEntry[] | null
}

type TeamMember = {
  key: string
  name: string
  role: string
  shortBio: string
  photoUrl: string
  linkedinUrl: string
  displayOrder: number | null
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

// A small format is plenty for a card avatar — no reason to ship the
// full-resolution original for a thumbnail.
function resolvePhotoUrl(media: StrapiMedia | null): string {
  if (!media) return ''
  return resolveMediaUrl(media.formats?.small?.url ?? media.formats?.thumbnail?.url ?? media.url)
}

function normalizeTeamMember(entry: TeamMemberEntry): TeamMember {
  return {
    key: entry.documentId ?? String(entry.id),
    name: entry.name ?? '',
    role: entry.role ?? '',
    shortBio: entry.shortBio ?? '',
    photoUrl: resolvePhotoUrl(firstMedia(entry.photo)),
    linkedinUrl: entry.linkedinUrl?.trim() ?? '',
    displayOrder: typeof entry.displayOrder === 'number' ? entry.displayOrder : null,
  }
}

// Ascending by displayOrder; entries missing a displayOrder sort after every
// entry that has one (relative order among themselves is left as the API
// returned them, since Array.prototype.sort is stable).
function compareByDisplayOrder(a: TeamMember, b: TeamMember): number {
  if (a.displayOrder !== null && b.displayOrder !== null) return a.displayOrder - b.displayOrder
  if (a.displayOrder !== null) return -1
  if (b.displayOrder !== null) return 1
  return 0
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
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

const errorStatusStyle = {
  ...statusStyle,
  color: 'var(--accent-warm)',
  borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
} as const

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

const sectionHeadingStyle = {
  fontFamily: 'var(--font-display-family)',
  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
  fontWeight: 900,
  letterSpacing: '-0.03em',
  lineHeight: 1.15,
  color: 'var(--foreground)',
} as const

function EyebrowLine() {
  return <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--accent)' }} />
}

// ── Team member card ───────────────────────────────────────────────
function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  )
}

// Professional profile card matching the site's shared Card shell (Services/
// Why Us/Demo/Careers/Blog). Whole card links out to LinkedIn only when the
// CMS entry actually has one — no empty LinkedIn affordance otherwise.
function TeamMemberCard({ member }: { member: TeamMember }) {
  const hasLink = Boolean(member.linkedinUrl)

  return (
    <Card
      as={hasLink ? 'a' : 'div'}
      href={hasLink ? member.linkedinUrl : undefined}
      target={hasLink ? '_blank' : undefined}
      rel={hasLink ? 'noopener noreferrer' : undefined}
    >
      <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: '5rem',
          height: '5rem',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--muted)',
          border: '1px solid var(--border)',
          marginBottom: '1.125rem',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span style={{ fontFamily: 'var(--font-display-family)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
              {initials(member.name)}
            </span>
          )}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-display-family)',
          fontSize: '1.0625rem',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          color: 'var(--foreground)',
          marginBottom: '0.25rem',
        }}>
          {member.name}
        </h3>

        {member.role && (
          <div style={{
            fontFamily: 'var(--font-mono-family)',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            fontWeight: 500,
            marginBottom: '0.875rem',
          }}>
            {member.role}
          </div>
        )}

        {member.shortBio && (
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--muted-foreground)' }}>
            {member.shortBio}
          </p>
        )}

        {hasLink && (
          <span style={{
            marginTop: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-mono-family)',
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}>
            <LinkedInIcon />
            LinkedIn
          </span>
        )}
      </div>
    </Card>
  )
}

export default function AboutPage() {
  const [about, setAbout] = useState<AboutFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadAbout() {
      try {
        const query = new URLSearchParams({ populate: '*' })
        const response = await fetch(`${ABOUT_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiAboutResponse = await response.json()
        const entry = pickEntry(payload.data)

        setAbout(entry ? normalize(entry) : null)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setAbout(null)
        setError(err instanceof Error ? err.message : 'Unable to reach the about API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadAbout()
    return () => controller.abort()
  }, [])

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadTeamMembers() {
      try {
        const query = new URLSearchParams({ populate: '*', 'pagination[pageSize]': String(PAGE_SIZE) })
        const response = await fetch(`${TEAM_MEMBERS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiTeamMembersResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setTeamMembers(entries.map(normalizeTeamMember).sort(compareByDisplayOrder))
        setTeamError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setTeamMembers([])
        setTeamError(err instanceof Error ? err.message : 'Unable to reach the team members API.')
      } finally {
        if (!controller.signal.aborted) setTeamLoading(false)
      }
    }

    loadTeamMembers()
    return () => controller.abort()
  }, [])

  return (
    <>
      {(loading || error || !about) && (
        <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            {loading && <div style={statusStyle}>Loading about content…</div>}
            {!loading && error && <div style={errorStatusStyle}>Could not load the about page. {error}</div>}
            {!loading && !error && !about && <div style={statusStyle}>About content not published yet.</div>}
          </div>
        </section>
      )}

      {!loading && !error && about && (
        <>
          {/* HERO */}
          <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
            <Reveal className="max-w-6xl mx-auto px-6 py-20">
              <div style={{ maxWidth: '44rem' }}>
                <div style={eyebrowStyle}>
                  <EyebrowLine />
                  {about.heroEyebrow ?? ''}
                </div>
                <h1 style={{
                  fontFamily: 'var(--font-display-family)',
                  fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.08,
                  color: 'var(--foreground)',
                  marginBottom: '1.25rem',
                }}>
                  {about.heroTitle ?? ''}
                </h1>
                <p style={{ fontSize: '1.125rem', lineHeight: 1.75, color: 'var(--muted-foreground)' }}>
                  {about.heroDescription ?? ''}
                </p>
              </div>
            </Reveal>
          </section>

          {/* WHO WE ARE */}
          {about.whoWeAreTitle && (
            <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
              <Reveal className="max-w-6xl mx-auto px-6 py-20">
                <div style={{ maxWidth: '48rem' }}>
                  <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '1rem' }}>
                    {about.whoWeAreTitle}
                  </h2>
                  {renderRichText(about.whoWeAreDescription)}
                </div>
              </Reveal>
            </section>
          )}

          {/* OUR TEAM */}
          <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
            <div className="max-w-6xl mx-auto px-6 py-20">
              {about.teamTitle && (
                <Reveal className="mb-10">
                  <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: about.teamDescription ? '0.75rem' : 0 }}>
                    {about.teamTitle}
                  </h2>
                  {about.teamDescription && (
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--muted-foreground)', maxWidth: '38rem' }}>
                      {about.teamDescription}
                    </p>
                  )}
                </Reveal>
              )}

              {teamLoading && <div style={statusStyle}>Loading team…</div>}

              {!teamLoading && teamError && (
                <div style={errorStatusStyle}>Could not load the team. {teamError}</div>
              )}

              {!teamLoading && !teamError && teamMembers.length === 0 && (
                <div style={statusStyle}>No team members published yet.</div>
              )}

              {!teamLoading && !teamError && teamMembers.length === 1 && (
                <div className="flex justify-center">
                  <div style={{ width: '100%', maxWidth: '22rem' }}>
                    <TeamMemberCard member={teamMembers[0]} />
                  </div>
                </div>
              )}

              {!teamLoading && !teamError && teamMembers.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member) => (
                    <TeamMemberCard key={member.key} member={member} />
                  ))}
                </div>
              )}
            </div>
          </section>

        </>
      )}
    </>
  )
}
