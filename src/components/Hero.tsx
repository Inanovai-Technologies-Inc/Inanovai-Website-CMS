export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)', minHeight: '92vh', display: 'flex', alignItems: 'center' }}
    >
      {/* Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          opacity: 0.6,
        }}
      />

      {/* Blue glow — top right */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-8%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Warm glow — bottom left */}
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-warm) 8%, transparent) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent-warm)',
              fontWeight: 500,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', background: 'linear-gradient(90deg, var(--accent-warm), var(--accent-warm-end))' }} />
              Introducing ANJU · iNanovai Technologies
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--foreground)',
              marginBottom: '1.75rem',
            }}>
              Business intelligence,{' '}
              <span style={{
                background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--accent-warm)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                truly adaptive.
              </span>
            </h1>

            <p style={{
              fontSize: '1.0625rem',
              lineHeight: 1.75,
              color: 'var(--muted-foreground)',
              maxWidth: '36rem',
              marginBottom: '0.875rem',
              fontWeight: 400,
            }}>
              <strong style={{ color: 'var(--foreground)', fontWeight: 700 }}>ANJU</strong> — Adaptive Neural Junction for Users — is iNanovai's AI layer that sits inside your operations, understands your data, and surfaces decisions before you have to ask for them.
            </p>

            <p style={{
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: 'var(--muted-foreground)',
              maxWidth: '34rem',
              marginBottom: '2.5rem',
            }}>
              Powered by a deep ERPNext and Frappe foundation, ANJU connects your entire business stack — ERP, CRM, HRM, inventory — into one intelligent, conversational interface.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#anju" style={{
                fontFamily: 'var(--font-display-family)',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: 'var(--accent-foreground)',
                backgroundColor: 'var(--accent)',
                padding: '0.875rem 2rem',
                borderRadius: 'var(--radius)',
                letterSpacing: '0.01em',
                display: 'inline-block',
              }} className="hover:opacity-90 transition-opacity">
                Explore ANJU
              </a>
              <a href="#contact" style={{
                fontFamily: 'var(--font-display-family)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--foreground)',
                backgroundColor: 'transparent',
                padding: '0.875rem 2rem',
                borderRadius: 'var(--radius)',
                border: '1.5px solid var(--border)',
                letterSpacing: '0.01em',
                display: 'inline-block',
              }} className="hover:border-current transition-colors">
                Book a Discovery Call
              </a>
            </div>
          </div>

          {/* Right — ANJU identity card */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'var(--card)',
            boxShadow: '0 24px 64px color-mix(in srgb, var(--accent) 8%, transparent)',
          }}>
            {/* Card header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              backgroundColor: 'var(--background)',
            }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F57', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#28C840', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em', marginLeft: '0.5rem' }}>
                ANJU · Adaptive Neural Junction for Users
              </span>
            </div>

            {/* Simulated chat */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                {
                  role: 'user',
                  text: 'What should I prioritize this week across finance and inventory?',
                },
                {
                  role: 'anju',
                  text: 'Three things need your attention:\n\n① 4 purchase orders awaiting approval — total ₹2.4L, two suppliers offering early-pay discount expiring Friday.\n\n② Stock of SKU-1042 (Ball Bearings 20mm) drops below safety level in 6 days based on current consumption rate.\n\n③ Q3 receivables aging report shows 3 accounts 45+ days overdue — I\'ve drafted a follow-up sequence for your review.',
                },
                {
                  role: 'user',
                  text: 'Approve the two with early-pay discounts and send me the follow-up drafts.',
                },
                {
                  role: 'anju',
                  text: 'Done. PO-2024-0891 and PO-2024-0893 approved — saving ₹18,400 combined. Follow-up emails queued in your draft folder, ready to review before sending.',
                },
              ].map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--secondary)',
                    color: msg.role === 'user' ? 'var(--accent-foreground)' : 'var(--foreground)',
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    fontFamily: 'var(--font-body-family)',
                  }}>
                    {msg.role === 'anju' && (
                      <div style={{
                        fontFamily: 'var(--font-mono-family)',
                        fontSize: '0.5625rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        marginBottom: '0.375rem',
                        fontWeight: 600,
                      }}>ANJU</div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', paddingLeft: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>ANJU is thinking</span>
                {[0, 1, 2].map(d => (
                  <span key={d} style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'inline-block',
                    animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-20 flex flex-wrap gap-12" style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
          {[
            { value: 'ANJU', label: 'AI product — production-ready' },
            { value: '50+', label: 'ERP implementations delivered' },
            { value: '12+', label: 'Industries served' },
            { value: '100%', label: 'Open-source ERP foundation' },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: stat.value === 'ANJU' ? '1.75rem' : '2rem',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: stat.value === 'ANJU' ? 'var(--accent)' : 'var(--foreground)',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
                marginTop: '0.25rem',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1.1);  }
        }
      `}</style>
    </section>
  )
}
