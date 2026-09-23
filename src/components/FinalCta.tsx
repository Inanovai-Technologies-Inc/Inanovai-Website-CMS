import { useEffect, useState } from 'react'
import Reveal from './motion/Reveal'
import Button from './motion/Button'

const CONTACT_ENDPOINT = 'http://localhost:1337/api/contact'

// Reuses the Contact section's own eyebrow/heading/description fields —
// one source of truth for "how we talk about getting in touch" instead of
// a second CMS type with overlapping copy.
type ContactFields = {
  eyebrow?: string
  heading?: string
  description?: string
}

type ContactEntry = ContactFields & {
  id?: number
  documentId?: string
  attributes?: ContactFields
}

type StrapiContactResponse = {
  data?: ContactEntry | ContactEntry[] | null
}

function pickEntry(data: StrapiContactResponse['data']): ContactEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalize(entry: ContactEntry): ContactFields {
  return entry.attributes ?? entry
}

type FinalCtaProps = {
  navigate: (to: string) => void
}

// A compact "get in touch" band for the standalone pages (Careers, Blog,
// Blog article) that don't render the full Contact section — without it,
// those pages are a dead end. The homepage doesn't need this: it already
// ends in the full Contact section.
export default function FinalCta({ navigate }: FinalCtaProps) {
  const [contact, setContact] = useState<ContactFields | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function loadContact() {
      try {
        const response = await fetch(CONTACT_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiContactResponse = await response.json()
        const entry = pickEntry(payload.data)

        setContact(entry ? normalize(entry) : null)
      } catch {
        if (controller.signal.aborted) return
        setContact(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadContact()
    return () => controller.abort()
  }, [])

  const goToContact = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/')
    // Home mounts on the next tick; wait two frames before scrolling so the
    // #contact section actually exists in the DOM (same pattern Nav uses).
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }))
  }

  // Supplementary content — if Strapi is unreachable or empty, the page
  // still works fine without this band, so fail silent rather than showing
  // an error box on every Careers/Blog visit.
  if (loading || !contact) return null

  return (
    <section style={{ backgroundColor: 'var(--card)', borderTop: '1px solid var(--border)' }}>
      <Reveal className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div>
          <div style={{
            fontFamily: 'var(--font-mono-family)',
            fontSize: '0.6875rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            fontWeight: 500,
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--accent)' }} />
            {contact.eyebrow ?? ''}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display-family)',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--foreground)',
            marginBottom: '0.75rem',
          }}>
            {contact.heading ?? ''}
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--muted-foreground)', maxWidth: '32rem' }}>
            {contact.description ?? ''}
          </p>
        </div>
        <Button as="a" href="/#contact" onClick={goToContact} variant="primary" style={{ padding: '0.875rem 2.25rem', whiteSpace: 'nowrap' }}>
          Get in Touch
        </Button>
      </Reveal>
    </section>
  )
}
