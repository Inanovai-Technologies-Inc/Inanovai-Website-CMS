import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { EASE } from './motion/ease'
import Reveal, { staggerDelay } from './motion/Reveal'
import { BlogTile } from './BlogPage'
import FinalCta from './FinalCta'

const BLOGS_ENDPOINT = 'http://localhost:1337/api/blogs'
const STRAPI_BASE_URL = 'http://localhost:1337'
const RELATED_COUNT = 3

type StrapiMedia = {
  id?: number
  url?: string
}

// Strapi's Blocks rich-text field: a tree of block nodes (paragraph, heading,
// list, list-item, quote, code) whose children are inline text/link leaves.
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

type BlogEntry = {
  id: number
  documentId?: string
  title?: string
  slug?: string
  category?: string
  excerpt?: string
  content?: RichText
  coverImage?: StrapiMedia[] | StrapiMedia | null
}

type StrapiCollectionResponse = {
  data?: BlogEntry[] | null
}

type Blog = {
  key: string
  title: string
  slug: string
  category: string
  excerpt: string
  content: RichText
  img: string
  alt: string
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

function normalize(entry: BlogEntry): Blog {
  const media = firstMedia(entry.coverImage)

  return {
    key: entry.documentId ?? String(entry.id),
    title: entry.title ?? '',
    slug: entry.slug ?? '',
    category: entry.category ?? '',
    excerpt: entry.excerpt ?? '',
    content: entry.content ?? null,
    img: resolveMediaUrl(media?.url),
    alt: entry.title ?? '',
  }
}

// Same category first (most relevant), then anything else, most-recent-API-
// order — excludes the article being read. Capped so the section stays a
// quick "keep reading" prompt, not a second full listing.
function pickRelated(all: Blog[], current: Blog, count: number): Blog[] {
  const others = all.filter((b) => b.slug !== current.slug)
  const sameCategory = current.category ? others.filter((b) => b.category === current.category) : []
  const rest = others.filter((b) => !sameCategory.includes(b))
  return [...sameCategory, ...rest].slice(0, count)
}

const bodyTextStyle = {
  fontSize: '1.0625rem',
  lineHeight: 1.85,
  color: 'var(--muted-foreground)',
  margin: '0 0 1.25rem',
} as const

// Explicit editorial scale per heading level — the browser's UA default
// (2em/1.5em/1.17em…) doesn't track this site's type system at all.
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
          marginTop: '2.25rem',
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

// A restrained vertical parallax on the cover image: the image drifts a
// little slower than the page scrolls, scaled up so the drift never shows
// a gap at the edges. Static under prefers-reduced-motion.
function CoverImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--muted)',
        aspectRatio: '16/9',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: '2.5rem',
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={shouldReduceMotion ? undefined : { y, scale: 1.15 }}
      />
    </div>
  )
}

type BlogPostPageProps = {
  slug: string
  navigate: (to: string) => void
}

export default function BlogPostPage({ slug, navigate }: BlogPostPageProps) {
  const shouldReduceMotion = useReducedMotion()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadBlog() {
      try {
        const query = new URLSearchParams({ 'filters[slug][$eq]': slug, 'populate': '*' })
        const response = await fetch(`${BLOGS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setBlog(entries[0] ? normalize(entries[0]) : null)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setBlog(null)
        setError(err instanceof Error ? err.message : 'Unable to reach the blog API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadBlog()
    return () => controller.abort()
  }, [slug])

  // Fetched once the current article resolves, since picking "related"
  // needs its category. Uses the same collection endpoint BlogPage already
  // calls — no new Strapi content.
  const [related, setRelated] = useState<Blog[]>([])

  useEffect(() => {
    if (!blog) {
      setRelated([])
      return
    }
    const currentBlog = blog

    const controller = new AbortController()

    async function loadRelated() {
      try {
        const query = new URLSearchParams({ populate: '*', 'pagination[pageSize]': '100' })
        const response = await fetch(`${BLOGS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) return

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        setRelated(pickRelated(entries.map(normalize), currentBlog, RELATED_COUNT))
      } catch {
        if (controller.signal.aborted) return
        setRelated([])
      }
    }

    loadRelated()
    return () => controller.abort()
  }, [blog?.slug, blog?.category])

  const backToBlog = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/blog')
  }

  const goToRelated = (e: React.MouseEvent, relatedSlug: string) => {
    e.preventDefault()
    navigate(`/blog/${relatedSlug}`)
  }

  return (
    <>
    <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-3xl mx-auto px-6 py-24">
        <a
          href="/blog"
          onClick={backToBlog}
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
          ← Back to blog
        </a>

        {loading && <div style={statusStyle}>Loading article…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load this article. {error}
          </div>
        )}

        {!loading && !error && !blog && (
          <div style={statusStyle}>Article not found.</div>
        )}

        {!loading && !error && blog && (
          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {blog.category && (
              <div style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.625rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--accent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                padding: '0.25rem 0.75rem',
                borderRadius: '2px',
                marginBottom: '1.25rem',
              }}>
                {blog.category}
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
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p style={{
                fontFamily: 'var(--font-body-family)',
                fontSize: '1.25rem',
                fontWeight: 500,
                lineHeight: 1.6,
                letterSpacing: '-0.005em',
                color: 'var(--foreground)',
                marginBottom: '2.25rem',
              }}>
                {blog.excerpt}
              </p>
            )}

            {blog.img && <CoverImage src={blog.img} alt={blog.alt} />}

            <div>{renderRichText(blog.content)}</div>
          </motion.article>
        )}

        {!loading && !error && blog && related.length > 0 && (
          <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--border)' }}>
            <Reveal style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 500,
              marginBottom: '1.5rem',
            }}>
              Related articles
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((post, i) => (
                <Reveal key={post.key} delay={staggerDelay(i)}>
                  <BlogTile blog={post} onNavigate={goToRelated} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>

    <FinalCta navigate={navigate} />
    </>
  )
}
