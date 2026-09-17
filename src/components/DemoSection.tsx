const demos = [
  {
    title: 'ANJU: Live Business Q&A',
    category: 'AI · ANJU',
    duration: '5 min',
    description:
      'Watch ANJU answer complex, cross-department questions in real time — pulling from ERP, CRM, and HR data to surface a single, coherent answer.',
    img: 'https://images.unsplash.com/photo-1750969185331-e03829f72c7d?w=800&h=450&fit=crop&auto=format',
    alt: 'Abstract neural network visualization representing AI processing',
    categoryColor: 'var(--accent)',
  },
  {
    title: 'Predictive Inventory & Finance',
    category: 'AI · Analytics',
    duration: '9 min',
    description:
      "See ANJU's forecasting engine in action — predicting stockouts weeks ahead, flagging cash flow gaps, and auto-generating purchase orders for approval.",
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format',
    alt: 'Analytics dashboard showing financial performance metrics',
    categoryColor: 'var(--accent)',
  },
  {
    title: 'ERPNext + ANJU Integration',
    category: 'ERP · Integration',
    duration: '11 min',
    description:
      'A walkthrough of how ANJU sits inside a live ERPNext instance — reading documents, triggering workflows, and conversing with your data without leaving your ERP.',
    img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop&auto=format',
    alt: 'Developer screen showing ERPNext and AI integration code',
    categoryColor: 'var(--accent-warm)',
  },
]

export default function DemoSection() {
  return (
    <section id="demos" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
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
              See it in action
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--foreground)',
            }}>
              ANJU &amp; ERPNext<br />demonstrations
            </h2>
          </div>
          <p style={{ maxWidth: '26rem', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>
            Short, focused walkthroughs showing real scenarios — not slide decks, not sales pitches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <div key={demo.title} className="group cursor-pointer">
              <div
                className="relative overflow-hidden mb-4"
                style={{
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--muted)',
                  aspectRatio: '16/9',
                }}
              >
                <img
                  src={demo.img}
                  alt={demo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,15,0.38)' }}>
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--background)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                    }}
                    className="group-hover:scale-110 transition-transform duration-200"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 2L11 7L3 12V2Z" fill="var(--accent)" />
                    </svg>
                  </div>
                </div>
                {/* Duration */}
                <div style={{
                  position: 'absolute',
                  bottom: '0.75rem',
                  right: '0.75rem',
                  fontFamily: 'var(--font-mono-family)',
                  fontSize: '0.625rem',
                  letterSpacing: '0.08em',
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius)',
                }}>
                  {demo.duration}
                </div>
                {/* Category badge */}
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  fontFamily: 'var(--font-mono-family)',
                  fontSize: '0.5625rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  backgroundColor: `color-mix(in srgb, ${demo.categoryColor} 80%, transparent)`,
                  padding: '0.25rem 0.625rem',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                }}>
                  {demo.category}
                </div>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--foreground)',
                marginBottom: '0.375rem',
              }}>
                {demo.title}
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--muted-foreground)' }}>
                {demo.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
