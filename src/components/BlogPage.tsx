import { useEffect, useState } from 'react'
import { STRAPI_URL } from '../config'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal, { staggerDelay } from './motion/Reveal'
import { EASE } from './motion/ease'

const BLOGS_ENDPOINT = `${STRAPI_URL}/api/blogs`
const STRAPI_BASE_URL = STRAPI_URL

// Strapi caps a collection request at 25 by default; ask for more so newly
// added posts keep appearing without touching this file again.
const PAGE_SIZE = 100

type StrapiMedia = {
  id?: number
  url?: string
}

type BlogEntry = {
  id: number
  documentId?: string
  title?: string
  slug?: string
  category?: string
  excerpt?: string
  coverImage?: StrapiMedia[] | StrapiMedia | null
}

type StrapiCollectionResponse = {
  data?: BlogEntry[] | null
}

export type Blog = {
  key: string
  title: string
  slug: string
  category: string
  excerpt: string
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
    img: resolveMediaUrl(media?.url),
    alt: entry.title ?? '',
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

// Blog cards are media-first, like the Demo tiles — same elevation
// language (radius-lg, shadow-sm → shadow-md, a small lift) without the
// bordered/padded shell that doesn't fit an edge-to-edge cover image.
export function BlogTile({ blog, onNavigate }: { blog: Blog; onNavigate: (e: React.MouseEvent, slug: string) => void }) {
  const shouldReduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.a
      href={`/blog/${blog.slug}`}
      onClick={(e) => onNavigate(e, blog.slug)}
      className="group"
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.25, ease: EASE }}
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
        {blog.img && (
          <img
            src={blog.img}
            alt={blog.alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {blog.category && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            fontFamily: 'var(--font-mono-family)',
            fontSize: '0.5625rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--on-media)',
            backgroundColor: 'color-mix(in srgb, var(--accent) 80%, transparent)',
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
          }}>
            {blog.category}
          </div>
        )}
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display-family)',
        fontSize: '1.0625rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--foreground)',
        marginBottom: '0.375rem',
      }}>
        {blog.title}
      </h3>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--muted-foreground)' }}>
        {blog.excerpt}
      </p>
    </motion.a>
  )
}

type BlogPageProps = {
  navigate: (to: string) => void
}

export default function BlogPage({ navigate }: BlogPageProps) {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadBlogs() {
      try {
        const query = new URLSearchParams({
          'populate': '*',
          'pagination[pageSize]': String(PAGE_SIZE),
        })
        const response = await fetch(`${BLOGS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCollectionResponse = await response.json()
        const entries = Array.isArray(payload.data) ? payload.data : []

        // Rendered in the order the API returns them.
        setBlogs(entries.map(normalize))
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setBlogs([])
        setError(err instanceof Error ? err.message : 'Unable to reach the blog API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadBlogs()
    return () => controller.abort()
  }, [])

  const goToPost = (e: React.MouseEvent, slug: string) => {
    e.preventDefault()
    navigate(`/blog/${slug}`)
  }

  return (
    <section id="blog" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="mb-16">
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
            From the blog
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display-family)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--foreground)',
          }}>
            Blog
          </h1>
        </Reveal>

        {loading && <div style={statusStyle}>Loading articles…</div>}

        {!loading && error && (
          <div style={{
            ...statusStyle,
            color: 'var(--accent-warm)',
            borderColor: 'color-mix(in srgb, var(--accent-warm) 30%, transparent)',
          }}>
            Could not load articles. {error}
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div style={statusStyle}>No articles published yet.</div>
        )}

        {!loading && !error && blogs.length === 1 && (
          <div className="flex justify-center">
            <div style={{ width: '100%', maxWidth: '22rem' }}>
              <Reveal>
                <BlogTile blog={blogs[0]} onNavigate={goToPost} />
              </Reveal>
            </div>
          </div>
        )}

        {!loading && !error && blogs.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {blogs.map((blog, i) => (
              <Reveal key={blog.key} delay={staggerDelay(i)}>
                <BlogTile blog={blog} onNavigate={goToPost} />
              </Reveal>
            ))}
          </div>
        )}

        {!loading && !error && blogs.length > 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, i) => (
              <Reveal key={blog.key} delay={staggerDelay(i)}>
                <BlogTile blog={blog} onNavigate={goToPost} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
