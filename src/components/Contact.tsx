import { useEffect, useState } from 'react'
import Button from './motion/Button'

const CONTACT_ENDPOINT = 'http://localhost:1337/api/contact'
const CONTACT_SUBMIT_ENDPOINT = 'http://localhost:1337/api/contact/submit'

type ContactFields = {
  eyebrow?: string
  heading?: string
  description?: string
  locationLabel?: string
  location?: string
  websiteLabel?: string
  website?: string
  specialtiesLabel?: string
  specialties?: string
  phoneLabel?: string
  phoneNumber?: string
  emailContactLabel?: string
  emailContact?: string
  nameLabel?: string
  namePlaceholder?: string
  companyLabel?: string
  companyPlaceholder?: string
  emailLabel?: string
  emailPlaceholder?: string
  helpLabel?: string
  helpPlaceholder?: string
  buttonText?: string
  successHeading?: string
  successMessage?: string
}

type ContactEntry = ContactFields & {
  id?: number
  documentId?: string
  attributes?: ContactFields
}

// Strapi v5 flat objects; tolerate either a single-type shape (data: object)
// or a collection-type shape (data: array) since either could back this
// endpoint, and take the first/only entry.
type StrapiContactResponse = {
  data?: ContactEntry | ContactEntry[] | null
}

function pickEntry(data: StrapiContactResponse['data']): ContactEntry | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalize(entry: ContactEntry): ContactFields {
  // Strapi v5 returns flat fields; fall back to the v4 `attributes` shape.
  return entry.attributes ?? entry
}

const infoLabelStyle = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.625rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--panel-fg-subtle)',
  marginBottom: '0.375rem',
} as const

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1H7.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />
    </svg>
  )
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [contact, setContact] = useState<ContactFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadContact() {
      try {
        const response = await fetch(CONTACT_ENDPOINT, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiContactResponse = await response.json()
        const entry = pickEntry(payload.data)

        setContact(entry ? normalize(entry) : null)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setContact(null)
        setError(err instanceof Error ? err.message : 'Unable to reach the contact API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadContact()
    return () => controller.abort()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(CONTACT_SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const payload: { success?: boolean; error?: string } = await response.json().catch(() => ({}))

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Request failed with status ${response.status}.`)
      }

      setSent(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send your message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    backgroundColor: 'var(--panel-input)',
    border: `1px solid ${focusedField === field ? 'var(--panel-accent)' : 'var(--panel-border-strong)'}`,
    borderRadius: 'var(--radius)',
    color: 'var(--footer-fg)',
    fontFamily: 'var(--font-body-family)',
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono-family)',
    fontSize: '0.625rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--panel-fg-subtle)',
    display: 'block',
    marginBottom: '0.375rem',
  }

  return (
    <section id="contact" style={{ backgroundColor: 'var(--footer-bg)', color: 'var(--footer-fg)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Left column */}
          <div>
            {loading && (
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                color: 'var(--panel-fg-muted)',
                marginBottom: '1rem',
              }}>
                Loading contact content…
              </div>
            )}

            {!loading && error && (
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                color: 'var(--accent-warm)',
                marginBottom: '1rem',
              }}>
                Contact content unavailable. {error}
              </div>
            )}

            <div
              style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.6875rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--panel-accent)',
                fontWeight: 500,
                marginBottom: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--panel-accent)' }} />
              {contact?.eyebrow ?? ''}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                color: 'var(--footer-fg)',
                marginBottom: '1.5rem',
              }}
            >
              {contact?.heading ?? ''}
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: 'var(--panel-fg-muted)',
                marginBottom: '3rem',
                maxWidth: '26rem',
              }}
            >
              {contact?.description ?? ''}
            </p>

            <div className="flex flex-col gap-6">
              {[
                { label: contact?.locationLabel ?? '', value: contact?.location ?? '' },
                { label: contact?.websiteLabel ?? '', value: contact?.website ?? '' },
                { label: contact?.specialtiesLabel ?? '', value: contact?.specialties ?? '' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={infoLabelStyle}>{item.label}</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--panel-fg-body)', lineHeight: 1.6 }}>
                    {item.value}
                  </div>
                </div>
              ))}

              {contact?.phoneNumber?.trim() && (
                <div>
                  <div style={infoLabelStyle}>{contact.phoneLabel ?? ''}</div>
                  <a
                    href={`tel:${contact.phoneNumber.trim()}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9375rem',
                      color: 'inherit',
                      textDecoration: 'none',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--panel-accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                  >
                    <PhoneIcon />
                    {contact.phoneNumber.trim()}
                  </a>
                </div>
              )}

              {contact?.emailContact?.trim() && (
                <div>
                  <div style={infoLabelStyle}>{contact.emailContactLabel ?? ''}</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--panel-fg-body)', lineHeight: 1.6 }}>
                    <a
                      href={`mailto:${contact.emailContact.trim()}`}
                      style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--panel-fg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                    >
                      {contact.emailContact.trim()}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column — form */}
          <div>
            {sent ? (
              <div
                style={{
                  backgroundColor: 'var(--panel-surface-2)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 'var(--radius)',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--panel-accent)' }}>✓</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display-family)',
                    fontSize: '1.375rem',
                    fontWeight: 800,
                    color: 'var(--footer-fg)',
                    marginBottom: '0.625rem',
                  }}
                >
                  Message sent successfully
                </h3>
                <p style={{ color: 'var(--panel-fg-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                  Thank you for reaching out. We'll get back to you soon.
                </p>
                <Button
                  as="button"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setForm({ name: '', email: '', company: '', message: '' })
                    setFocusedField(null)
                    setSubmitError(null)
                    setSent(false)
                  }}
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" style={labelStyle}>{contact?.nameLabel ?? ''}</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder={contact?.namePlaceholder ?? ''}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('name')}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-company" style={labelStyle}>{contact?.companyLabel ?? ''}</label>
                    <input
                      id="contact-company"
                      type="text"
                      placeholder={contact?.companyPlaceholder ?? ''}
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      onFocus={() => setFocusedField('company')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('company')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" style={labelStyle}>{contact?.emailLabel ?? ''}</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder={contact?.emailPlaceholder ?? ''}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('email')}
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" style={labelStyle}>{contact?.helpLabel ?? ''}</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder={contact?.helpPlaceholder ?? ''}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle('message'), resize: 'vertical' }}
                  />
                </div>

                <Button
                  as="button"
                  type="submit"
                  variant="primary"
                  aria-disabled={submitting}
                  style={{
                    padding: '0.875rem 2rem',
                    alignSelf: 'flex-start',
                    backgroundColor: 'var(--panel-accent-strong)',
                    opacity: submitting ? 0.6 : 1,
                    pointerEvents: submitting ? 'none' : 'auto',
                  }}
                >
                  {submitting ? 'Sending…' : (contact?.buttonText ?? '')}
                </Button>

                {submitError && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--accent-warm)', margin: 0 }}>
                    {submitError}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
