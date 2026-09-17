const pillars = [
  {
    index: '01',
    category: 'AI',
    title: 'AI-Native Architecture',
    body: 'ANJU is not a plugin or an afterthought. It is designed from the ground up as an intelligence layer — embedded in your workflows, not sitting above them.',
  },
  {
    index: '02',
    category: 'AI',
    title: 'Context-Aware Reasoning',
    body: 'ANJU understands your business context — your industry, your approval patterns, your terminology. Responses are specific to your operations, not generic AI output.',
  },
  {
    index: '03',
    category: 'AI',
    title: 'Adaptive Learning',
    body: "The more your team uses ANJU, the sharper it gets. It learns from your decisions, adapts to role-specific needs, and continuously improves its recommendations.",
  },
  {
    index: '04',
    category: 'ERP',
    title: 'Deep ERPNext Expertise',
    body: 'Years of hands-on ERPNext and Frappe experience across manufacturing, healthcare, retail, and logistics — ANJU is built on a foundation that actually understands ERP data.',
  },
  {
    index: '05',
    category: 'ERP',
    title: 'Fully Open Source',
    body: 'No vendor lock-in, ever. Our ERP stack — and the Frappe foundation ANJU runs on — is fully open source. Your data, your infrastructure, your control.',
  },
  {
    index: '06',
    category: 'Both',
    title: 'Human-Centered Design',
    body: 'ANJU augments your people, it does not replace them. We design systems that make teams faster and smarter — not systems that make teams irrelevant.',
  },
]

const categoryColor: Record<string, string> = {
  AI: 'var(--accent)',
  ERP: 'var(--accent-warm)',
  Both: 'var(--muted-foreground)',
}

export default function WhyUs() {
  return (
    <section
      id="why-us"
      style={{ backgroundColor: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end gap-10 mb-16">
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
              Why iNanovai
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--foreground)',
            }}>
              Where AI meets<br />operational depth.
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
              Every commitment maps directly to how ANJU and our ERP practice work together — not as separate offerings, but as one integrated capability.
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ border: '1px solid var(--border)', overflow: 'hidden', borderRadius: 'var(--radius)' }}
        >
          {pillars.map((pillar, i) => (
            <div
              key={pillar.index}
              style={{
                padding: '2rem 2.25rem',
                borderRight: i % 3 !== 2 ? '1px solid var(--border)' : undefined,
                borderBottom: i < 3 ? '1px solid var(--border)' : undefined,
                backgroundColor: 'var(--background)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.125rem' }}>
                <span style={{
                  fontFamily: 'var(--font-mono-family)',
                  fontSize: '0.5625rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: categoryColor[pillar.category],
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
