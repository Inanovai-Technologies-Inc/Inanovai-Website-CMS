import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    backgroundColor: 'rgba(255,255,255,0.07)',
    border: `1px solid ${focusedField === field ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
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
    color: 'rgba(238,238,245,0.45)',
    display: 'block',
    marginBottom: '0.375rem',
  }

  return (
    <footer id="contact" style={{ backgroundColor: 'var(--footer-bg)', color: 'var(--footer-fg)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Left column */}
          <div>
            <div
              style={{
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
              }}
            >
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--accent)' }} />
              Get in touch
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
              {"Let's build something that lasts."}
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: 'rgba(238,238,245,0.55)',
                marginBottom: '3rem',
                maxWidth: '26rem',
              }}
            >
              Whether you're evaluating ERPNext for the first time or need to migrate from legacy software, we'll start with an honest, no-pressure discovery call.
            </p>

            <div className="flex flex-col gap-6">
              {[
                { label: 'Location', value: 'Kitchener, Ontario, Canada N2G 0C7' },
                { label: 'Website', value: 'inanovai.com' },
                { label: 'Specialties', value: 'ERPNext · Frappe · ERP · CRM · HRM · Business Intelligence' },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono-family)',
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(238,238,245,0.4)',
                      marginBottom: '0.375rem',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: 'rgba(238,238,245,0.8)', lineHeight: 1.6 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — form */}
          <div>
            {sent ? (
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius)',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)' }}>✓</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display-family)',
                    fontSize: '1.375rem',
                    fontWeight: 800,
                    color: 'var(--footer-fg)',
                    marginBottom: '0.625rem',
                  }}
                >
                  Message received.
                </h3>
                <p style={{ color: 'rgba(238,238,245,0.55)', fontSize: '0.9375rem' }}>
                  {"We'll be in touch within one business day."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" style={labelStyle}>Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Sarah Chen"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('name')}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-company" style={labelStyle}>Company</label>
                    <input
                      id="contact-company"
                      type="text"
                      placeholder="Meridian Manufacturing"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      onFocus={() => setFocusedField('company')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('company')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" style={labelStyle}>Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="sarah@meridianmfg.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('email')}
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" style={labelStyle}>How can we help?</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder="We're a mid-size manufacturer looking to replace QuickBooks with ERPNext..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle('message'), resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    fontFamily: 'var(--font-display-family)',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'var(--accent-foreground)',
                    backgroundColor: 'var(--accent)',
                    padding: '0.875rem 2rem',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                    alignSelf: 'flex-start',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{ borderTop: '1px solid rgba(238,238,245,0.1)', marginTop: '4rem', paddingTop: '2rem' }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <span
            style={{
              fontFamily: 'var(--font-display-family)',
              fontWeight: 800,
              fontSize: '1rem',
              color: 'rgba(238,238,245,0.6)',
              letterSpacing: '-0.02em',
            }}
          >
            iNanovai Technologies
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.625rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(238,238,245,0.3)',
            }}
          >
            © {new Date().getFullYear()} iNanovai Technologies Inc. — Kitchener, Ontario
          </span>
        </div>
      </div>
    </footer>
  )
}
