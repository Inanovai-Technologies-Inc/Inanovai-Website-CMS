import { useEffect, useState } from 'react'
import { STRAPI_URL } from '../config'

const CONTACT_ENDPOINT = `${STRAPI_URL}/api/contact`

// Reuses the Contact section's own footerCompany/footerCopyright fields —
// one source of truth instead of a second CMS type with overlapping copy.
// Duplicated fetch, matching this codebase's existing convention of keeping
// each component's Strapi wiring self-contained.
type FooterFields = {
  footerCompany?: string
  footerCopyright?: string
}

type FooterEntry = FooterFields & {
  id?: number
  documentId?: string
  attributes?: FooterFields
}

type StrapiContactResponse = {
  data?: FooterEntry | FooterEntry[] | null
}

function pickEntry(data: StrapiContactResponse['data']): FooterEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalize(entry: FooterEntry): FooterFields {
  return entry.attributes ?? entry
}

// Same routes/anchors already used in Nav.tsx. Hash entries navigate home
// first (via the page router) so they resolve correctly from any route,
// then scroll to the in-page anchor once the homepage has mounted.
const FOOTER_LINKS: { label: string; href: string; isHash?: boolean }[] = [
  { label: 'Services', href: '#services', isHash: true },
  { label: 'Why Us', href: '#why-us', isHash: true },
  { label: 'Careers', href: '/careers' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '#contact', isHash: true },
]

type FooterProps = {
  navigate: (to: string) => void
}

export default function Footer({ navigate }: FooterProps) {
  const [footer, setFooter] = useState<FooterFields | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFooter() {
      try {
        const response = await fetch(CONTACT_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiContactResponse = await response.json()
        const entry = pickEntry(payload.data)

        setFooter(entry ? normalize(entry) : null)
      } catch {
        if (controller.signal.aborted) return
        setFooter(null)
      }
    }

    loadFooter()
    return () => controller.abort()
  }, [])

  const goToAnchor = (e: React.MouseEvent, hash: string) => {
    e.preventDefault()
    if (window.location.pathname === '/') {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/')
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }))
  }

  return (
    <footer style={{ backgroundColor: 'var(--footer-bg)', color: 'var(--footer-fg)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Footer nav */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <span
            style={{
              fontFamily: 'var(--font-display-family)',
              fontWeight: 800,
              fontSize: '1rem',
              color: 'var(--panel-fg-muted)',
              letterSpacing: '-0.02em',
            }}
          >
            {footer?.footerCompany ?? ''}
          </span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={link.isHash ? (e) => goToAnchor(e, link.href) : (e) => { e.preventDefault(); navigate(link.href) }}
                style={{ fontSize: '0.8125rem', color: 'var(--panel-fg-subtle)', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--panel-fg)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--panel-fg-subtle)')}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Footer bar */}
        <div
          style={{ borderTop: '1px solid var(--panel-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <span
            style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.625rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--panel-fg-faint)',
            }}
          >
            {footer?.footerCopyright ?? ''}
          </span>
        </div>
      </div>
    </footer>
  )
}
