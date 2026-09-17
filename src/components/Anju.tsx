import { useState, useEffect, useRef } from 'react'

const capabilities = [
  {
    icon: '◈',
    title: 'Natural Language Queries',
    body: 'Ask anything about your business in plain language. ANJU understands context across departments — finance, inventory, HR — and responds with precise, actionable answers.',
  },
  {
    icon: '◎',
    title: 'Predictive Intelligence',
    body: 'ANJU spots patterns in your historical data to forecast demand, flag cash flow risks, and predict equipment maintenance needs — days or weeks before they become problems.',
  },
  {
    icon: '⬡',
    title: 'Workflow Automation',
    body: 'ANJU learns your approval patterns and automates routine decisions. It drafts, routes, and escalates — only bringing humans in where judgment is genuinely needed.',
  },
  {
    icon: '⊕',
    title: 'Cross-System Synthesis',
    body: 'ANJU connects ERP, CRM, HRM, and financial data into a single reasoning layer. No more tab-switching to reconcile numbers from three different systems.',
  },
  {
    icon: '◐',
    title: 'Adaptive Personalization',
    body: 'Every user gets a different ANJU. It learns your role, priorities, and communication preferences — so a CFO and a warehouse manager see the same data through completely different lenses.',
  },
  {
    icon: '◻',
    title: 'Proactive Alerting',
    body: "ANJU doesn't wait for you to ask. It monitors your operations continuously and surfaces risks, opportunities, and anomalies the moment they emerge.",
  },
]

const scenarios = [
  {
    label: 'Finance',
    query: 'How does our cash position look for the next 30 days?',
    response: 'Current cash: ₹18.4L. Projected outflows include payroll (₹6.2L, due 15th) and 3 vendor settlements (₹4.8L total). With expected receivables, you\'ll maintain a ₹9.1L buffer — but SKU reorder for Nov will tighten this. I recommend deferring the discretionary capex until Dec.',
  },
  {
    label: 'Inventory',
    query: 'Which SKUs are at risk of stockout this quarter?',
    response: '7 SKUs flagged. Critical: Ball Bearings 20mm (6 days), Copper Wire 2.5mm (11 days). Moderate risk: 5 others with 18–24 day runway. I\'ve pre-filled purchase orders for the critical items — awaiting your approval. Supplier lead times have been factored in.',
  },
  {
    label: 'HR & Ops',
    query: 'Are there any compliance deadlines I\'m missing this month?',
    response: '3 items need attention: ① ESI challan due Nov 21 — I\'ve prepared the draft. ② 2 employee contracts expire Nov 30 — renewal reminders sent to HR. ③ Annual fire safety inspection overdue by 12 days — vendor contact details shared with your facilities team.',
  },
]

// ── Shared types ──────────────────────────────────────────────
type Scenario = { label: string; query: string; response: string }

// ── Shared chat panel ─────────────────────────────────────────
function ChatPanel({ scenario }: { scenario: Scenario }) {
  return (
    <div style={{
      border: '1px solid rgba(238,238,245,0.1)',
      borderRadius: '6px',
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.02)',
    }}>
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid rgba(238,238,245,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['rgba(255,95,87,0.6)', 'rgba(255,189,46,0.6)', 'rgba(40,200,64,0.6)'].map((c) => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', color: 'rgba(238,238,245,0.3)', letterSpacing: '0.1em', marginLeft: '0.5rem' }}>
          anju-session · {scenario.label.toLowerCase()} context
        </span>
      </div>

      <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '75%', padding: '0.75rem 1.125rem',
            borderRadius: '12px 12px 2px 12px',
            backgroundColor: 'rgba(61,126,200,0.25)', border: '1px solid rgba(61,126,200,0.3)',
            fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(238,238,245,0.9)',
            fontFamily: 'var(--font-body-family)',
          }}>
            {scenario.query}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{
            maxWidth: '80%', padding: '1rem 1.25rem',
            borderRadius: '12px 12px 12px 2px',
            backgroundColor: 'rgba(238,238,245,0.05)', border: '1px solid rgba(238,238,245,0.1)',
            fontSize: '0.875rem', lineHeight: 1.75, color: 'rgba(238,238,245,0.8)',
            fontFamily: 'var(--font-body-family)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>
              ANJU
            </div>
            {scenario.response}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Scroll-driven version (lg+) ───────────────────────────────
function ScrollScenarios({ scenarios }: { scenarios: Scenario[] }) {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const scrolled = Math.max(0, -rect.top)
      const total = Math.min(1, scrolled / scrollable)
      const raw = total * scenarios.length
      setActive(Math.min(scenarios.length - 1, Math.floor(raw)))
      setProgress(total >= 1 ? 1 : raw % 1)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [scenarios.length])

  return (
    <div ref={containerRef} className="hidden lg:block" style={{ height: `${scenarios.length * 100}vh` }}>
      <div style={{ position: 'sticky', top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2.5rem' }}>
        <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,238,245,0.4)' }}>
          ANJU in context — scroll to explore
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left: scenario list with progress bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {scenarios.map((s, i) => {
              const isPast = i < active
              const isCurrent = i === active
              const barWidth = isPast ? '100%' : isCurrent ? `${progress * 100}%` : '0%'
              return (
                <div key={s.label}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', marginBottom: '0.625rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.625rem', color: isCurrent ? 'var(--accent)' : isPast ? 'rgba(238,238,245,0.25)' : 'rgba(238,238,245,0.2)', letterSpacing: '0.1em', transition: 'color 0.4s' }}>
                      0{i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display-family)', fontSize: '1.0625rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? '#FFFFFF' : isPast ? 'rgba(238,238,245,0.3)' : 'rgba(238,238,245,0.4)', letterSpacing: '-0.01em', transition: 'all 0.4s' }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ height: '2px', backgroundColor: 'rgba(238,238,245,0.08)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: barWidth, backgroundColor: 'var(--accent)', borderRadius: 1, transition: isCurrent ? 'width 0.1s linear' : 'width 0.4s ease' }} />
                  </div>
                  {isCurrent && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', lineHeight: 1.65, color: 'rgba(238,238,245,0.45)', fontFamily: 'var(--font-body-family)' }}>
                      {s.query}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right: animated chat panel */}
          <div style={{ transition: 'opacity 0.35s, transform 0.35s' }}>
            <ChatPanel scenario={scenarios[active]} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Click-tab fallback (mobile) ───────────────────────────────
function ClickScenarios({ scenarios }: { scenarios: Scenario[] }) {
  const [active, setActive] = useState(0)
  return (
    <div className="lg:hidden">
      <div style={{ fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,238,245,0.4)', marginBottom: '1.5rem' }}>
        ANJU in context — select a scenario
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {scenarios.map((s, i) => (
          <button key={s.label} onClick={() => setActive(i)} style={{
            fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.5rem 1.25rem', borderRadius: 'var(--radius)',
            border: `1px solid ${active === i ? 'var(--accent)' : 'rgba(238,238,245,0.15)'}`,
            backgroundColor: active === i ? 'var(--accent)' : 'transparent',
            color: active === i ? '#FFFFFF' : 'rgba(238,238,245,0.5)',
            cursor: 'pointer', transition: 'all 0.15s', fontWeight: 500,
          }}>
            {s.label}
          </button>
        ))}
      </div>
      <ChatPanel scenario={scenarios[active]} />
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────
export default function Anju() {

  return (
    <section
      id="anju"
      style={{
        backgroundColor: 'var(--foreground)',
        color: 'var(--primary-foreground)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-28">

        {/* Header */}
        <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          <div>
            <div style={{
              fontFamily: 'var(--font-mono-family)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 500,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--accent)' }} />
              Product · ANJU
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              color: '#FFFFFF',
            }}>
              Adaptive Neural<br />
              Junction for Users.
            </h2>
          </div>
          <p style={{
            fontSize: '1rem',
            lineHeight: 1.75,
            color: 'rgba(238,238,245,0.6)',
            maxWidth: '32rem',
          }}>
            ANJU is not a chatbot bolted onto your software. It is a reasoning engine embedded inside your operations — trained on your data, shaped by your workflows, and designed to reduce the distance between information and decision to zero.
          </p>
        </div>

        {/* Capabilities grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-24"
          style={{ border: '1px solid rgba(238,238,245,0.1)', overflow: 'hidden', borderRadius: '6px' }}
        >
          {capabilities.map((cap, i) => (
            <div
              key={cap.title}
              style={{
                padding: '2rem 2.25rem',
                borderRight: i % 3 !== 2 ? '1px solid rgba(238,238,245,0.08)' : undefined,
                borderBottom: i < 3 ? '1px solid rgba(238,238,245,0.08)' : undefined,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(238,238,245,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '1.25rem',
                color: 'var(--accent)',
                marginBottom: '1rem',
                display: 'block',
              }}>
                {cap.icon}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
                marginBottom: '0.625rem',
                lineHeight: 1.3,
              }}>
                {cap.title}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                lineHeight: 1.7,
                color: 'rgba(238,238,245,0.55)',
              }}>
                {cap.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Scroll-driven scenario demo (desktop) ── */}
        <ScrollScenarios scenarios={scenarios} />

        {/* ── Click-tab fallback (mobile) ── */}
        <ClickScenarios scenarios={scenarios} />

        {/* Platform integration strip */}
        <div style={{
          marginTop: '4rem',
          padding: '2.5rem',
          border: '1px solid rgba(238,238,245,0.1)',
          borderRadius: '6px',
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}>
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div style={{ flex: '0 0 auto', maxWidth: '22rem' }}>
              <div style={{
                fontFamily: 'var(--font-mono-family)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                fontWeight: 500,
                marginBottom: '0.75rem',
              }}>
                Deploy anywhere
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display-family)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                marginBottom: '0.625rem',
              }}>
                ANJU meets your team where they already work.
              </h3>
              <p style={{
                fontSize: '0.875rem',
                lineHeight: 1.7,
                color: 'rgba(238,238,245,0.5)',
              }}>
                No new tools to learn. Configure ANJU inside your existing chat platform — your team interacts in natural language, ANJU connects to your ERP behind the scenes.
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'stretch' }}>
              {[
                {
                  name: 'Microsoft Teams',
                  desc: 'Query ERP data, approve workflows, and get proactive alerts directly in Teams channels and chats.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M17.5 8.75a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" fill="#5059C9"/>
                      <path d="M20.125 10.5h-4.667a.583.583 0 0 0-.583.583v5.834A4.083 4.083 0 0 1 10.792 21H9.625A4.625 4.625 0 0 0 14.25 25.375h5.875A2.625 2.625 0 0 0 22.75 22.75V13.125A2.625 2.625 0 0 0 20.125 10.5Z" fill="#5059C9"/>
                      <circle cx="10.5" cy="8.167" r="3.167" fill="#7B83EB"/>
                      <path d="M4.083 12.833A2.333 2.333 0 0 0 6.417 15.167h8.166A2.333 2.333 0 0 0 16.917 12.833V12A2.333 2.333 0 0 0 14.583 9.667H6.417A2.333 2.333 0 0 0 4.083 12v.833Z" fill="#7B83EB"/>
                      <path d="M10.5 15.167v5.25a4.083 4.083 0 0 1-4.083-4.084v-1.166h2.917A1.167 1.167 0 0 0 10.5 15.167Z" fill="#5059C9"/>
                    </svg>
                  ),
                  color: '#5059C9',
                },
                {
                  name: 'Google Chat',
                  desc: 'Add ANJU as a Google Chat bot — ask business questions directly from Spaces and get structured answers.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M14 3.5C8.201 3.5 3.5 8.201 3.5 14c0 5.799 4.701 10.5 10.5 10.5h.583V19.25H14A7.875 7.875 0 0 1 6.125 11.375 7.875 7.875 0 0 1 14 3.5Z" fill="#0F9D58"/>
                      <path d="M22.458 9.625A10.476 10.476 0 0 0 14 3.5v5.833a4.667 4.667 0 1 1 0 9.334H14v5.25A10.5 10.5 0 0 0 24.5 14a10.44 10.44 0 0 0-2.042-4.375Z" fill="#4285F4"/>
                      <circle cx="14" cy="14" r="3.5" fill="#FBBC05"/>
                    </svg>
                  ),
                  color: '#4285F4',
                },
                {
                  name: 'WhatsApp',
                  desc: 'Field-friendly access for on-the-ground teams. Check stock, raise requests, and get answers on any phone.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M14 3.5C8.201 3.5 3.5 8.201 3.5 14c0 1.969.548 3.81 1.5 5.378L3.5 24.5l5.291-1.468A10.44 10.44 0 0 0 14 24.5c5.799 0 10.5-4.701 10.5-10.5S19.799 3.5 14 3.5Z" fill="#25D366"/>
                      <path d="M19.076 16.748c-.28-.14-1.662-.82-1.92-.912-.258-.093-.445-.14-.632.14-.187.28-.724.912-.888 1.099-.163.187-.327.21-.607.07-.28-.14-1.18-.435-2.248-1.388-.831-.741-1.392-1.657-1.555-1.937-.163-.28-.017-.431.122-.57.126-.126.28-.327.42-.49.14-.163.187-.28.28-.467.094-.187.047-.35-.023-.49-.07-.14-.632-1.522-.866-2.083-.228-.548-.46-.474-.632-.483l-.538-.009c-.187 0-.49.07-.747.35-.257.28-.98.958-.98 2.335s1.003 2.707 1.143 2.894c.14.187 1.975 3.015 4.783 4.228.668.288 1.19.46 1.596.589.67.213 1.28.183 1.762.111.537-.08 1.662-.68 1.896-1.337.234-.658.234-1.222.163-1.34-.07-.117-.257-.187-.538-.327Z" fill="white"/>
                    </svg>
                  ),
                  color: '#25D366',
                },
                {
                  name: 'Telegram',
                  desc: 'Secure, fast, and available everywhere. Perfect for distributed or international teams using Telegram for ops.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="10.5" fill="url(#tg-grad)"/>
                      <path d="M8.283 13.868l8.5-3.278c.394-.143.738.096.611.691l-1.449 6.822c-.107.482-.393.6-.797.373l-2.2-1.622-1.063 1.024c-.118.118-.217.217-.445.217l.158-2.244 4.09-3.696c.178-.158-.039-.246-.275-.088l-5.054 3.18-2.178-.68c-.473-.148-.483-.473.099-.7Z" fill="white"/>
                      <defs>
                        <linearGradient id="tg-grad" x1="14" y1="3.5" x2="14" y2="24.5" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#2AABEE"/>
                          <stop offset="1" stopColor="#229ED9"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  ),
                  color: '#2AABEE',
                },
              ].map((platform) => (
                <div
                  key={platform.name}
                  style={{
                    flex: '1 1 calc(50% - 0.5rem)',
                    minWidth: '160px',
                    padding: '1.25rem',
                    border: '1px solid rgba(238,238,245,0.08)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `color-mix(in srgb, ${platform.color} 40%, transparent)`
                    e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${platform.color} 6%, transparent)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(238,238,245,0.08)'
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>{platform.icon}</div>
                  <div style={{
                    fontFamily: 'var(--font-display-family)',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '0.375rem',
                    letterSpacing: '-0.01em',
                  }}>
                    {platform.name}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.65,
                    color: 'rgba(238,238,245,0.45)',
                    fontFamily: 'var(--font-body-family)',
                  }}>
                    {platform.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA strip */}
        <div style={{
          marginTop: '4rem',
          paddingTop: '3rem',
          borderTop: '1px solid rgba(238,238,245,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display-family)',
              fontSize: '1.375rem',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
            }}>
              Ready to meet ANJU?
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'rgba(238,238,245,0.5)' }}>
              Request a live demo tailored to your industry and stack.
            </div>
          </div>
          <a href="#contact" style={{
            fontFamily: 'var(--font-display-family)',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--accent-foreground)',
            backgroundColor: 'var(--accent)',
            padding: '0.875rem 2.25rem',
            borderRadius: 'var(--radius)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Request a Demo
          </a>
        </div>
      </div>
    </section>
  )
}
