const services = [
  {
    index: '01',
    category: 'AI',
    title: 'ANJU — AI Copilot',
    description:
      'Deploy ANJU inside your operations. Natural language interface, predictive intelligence, and automated decision support — all trained on your specific business context.',
    tags: ['Natural Language', 'Predictions', 'Automation'],
    href: '#anju',
    cta: 'Learn more →',
    highlight: true,
  },
  {
    index: '02',
    category: 'AI',
    title: 'AI-Powered Analytics',
    description:
      'Go beyond static reports. ANJU surfaces live insights, anomaly alerts, and trend forecasts across your ERP, CRM, and financial data — continuously, without manual queries.',
    tags: ['Forecasting', 'Anomaly Detection', 'Live Dashboards'],
    href: '#contact',
    cta: 'Inquire →',
    highlight: false,
  },
  {
    index: '03',
    category: 'AI',
    title: 'Intelligent Workflow Automation',
    description:
      'ANJU learns your approval chains, SLAs, and escalation rules. It automates the routine, flags the exceptions, and routes everything to the right person at the right time.',
    tags: ['Adaptive Routing', 'SLA Management', 'Exception Handling'],
    href: '#contact',
    cta: 'Inquire →',
    highlight: false,
  },
  {
    index: '04',
    category: 'ERP',
    title: 'ERPNext Implementation',
    description:
      'End-to-end deployment and migration tailored to your workflows. We handle discovery, data migration, user training, and go-live support so your team hits the ground running.',
    tags: ['Discovery', 'Migration', 'Training', 'Go-Live'],
    href: '#contact',
    cta: 'Inquire →',
    highlight: false,
  },
  {
    index: '05',
    category: 'ERP',
    title: 'Frappe App Development',
    description:
      'Custom applications built on the Frappe framework — purpose-fit for your unique operational needs, with emphasis on quality, scalability, and long-term maintainability.',
    tags: ['Custom Apps', 'API Design', 'Scalable Architecture'],
    href: '#contact',
    cta: 'Inquire →',
    highlight: false,
  },
  {
    index: '06',
    category: 'ERP',
    title: 'Integration & Support',
    description:
      'Connect your entire stack: ERP, CRM, HRM, payment gateways, legacy systems, and third-party SaaS. Then keep it all running with a dedicated support retainer.',
    tags: ['REST APIs', 'Legacy Systems', 'Retainer Support'],
    href: '#contact',
    cta: 'Inquire →',
    highlight: false,
  },
]

const categoryColor: Record<string, string> = {
  AI: 'var(--accent)',
  ERP: 'var(--accent-warm)',
}

export default function Services() {
  return (
    <section id="services" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
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
              What we do
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--foreground)',
            }}>
              AI solutions &amp;<br />ERP expertise
            </h2>
          </div>
          <p style={{
            maxWidth: '28rem',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--muted-foreground)',
          }}>
            iNanovai operates at the intersection of AI product development and open-source ERP — two disciplines that are most powerful together.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ border: '1px solid var(--border)', overflow: 'hidden', borderRadius: 'var(--radius)' }}
        >
          {services.map((service, i) => (
            <div
              key={service.index}
              style={{
                backgroundColor: 'var(--background)',
                padding: '2.25rem',
                borderRight: i % 3 !== 2 ? '1px solid var(--border)' : undefined,
                borderBottom: i < 3 ? '1px solid var(--border)' : undefined,
                transition: 'background-color 0.2s',
                cursor: 'default',
                position: 'relative',
              }}
              className="group"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background)')}
            >
              {/* Category + index row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span style={{
                  fontFamily: 'var(--font-mono-family)',
                  fontSize: '0.5625rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: categoryColor[service.category],
                  backgroundColor: `color-mix(in srgb, ${categoryColor[service.category]} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${categoryColor[service.category]} 25%, transparent)`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '2px',
                }}>
                  {service.category}
                </span>
                <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>
                  {service.index}
                </span>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: '1.1875rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--foreground)',
                marginBottom: '0.75rem',
                lineHeight: 1.25,
              }}>
                {service.title}
              </h3>

              <p style={{
                fontSize: '0.9rem',
                lineHeight: 1.7,
                color: 'var(--muted-foreground)',
                marginBottom: '1.5rem',
              }}>
                {service.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {service.tags.map((tag) => (
                    <span key={tag} style={{
                      fontFamily: 'var(--font-mono-family)',
                      fontSize: '0.5625rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={service.href}
                  style={{
                    fontFamily: 'var(--font-mono-family)',
                    fontSize: '0.625rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--muted-foreground)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseEnter={(e) => (e.currentTarget.style.color = categoryColor[service.category])}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                >
                  {service.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
