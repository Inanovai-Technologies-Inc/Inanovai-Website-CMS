import { useEffect, useState, useCallback } from 'react'

const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'anju', label: 'ANJU' },
  { id: 'services', label: 'Services' },
  { id: 'why-us', label: 'Why Us' },
  { id: 'demos', label: 'Demos' },
  { id: 'contact', label: 'Contact' },
]

export default function ScrollUI() {
  const [progress, setProgress] = useState(0)
  const [activeSection, setActiveSection] = useState('hero')

  const onScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)

    // find which section is in view
    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      const el = document.getElementById(SECTIONS[i].id)
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
        setActiveSection(SECTIONS[i].id)
        break
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  return (
    <>
      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '2px',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--accent-warm), var(--accent-warm-end), var(--accent))',
          zIndex: 100,
          transition: 'width 0.1s linear',
        }}
      />

      {/* Section dot nav — right side */}
      <nav
        aria-label="Section navigation"
        style={{
          position: 'fixed',
          right: '1.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center',
        }}
        className="hidden lg:flex"
      >
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-label={section.label}
              title={section.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '0.75rem',
                height: '0.75rem',
                position: 'relative',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: isActive ? '0.5rem' : '0.3125rem',
                  height: isActive ? '0.5rem' : '0.3125rem',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--border)',
                  border: isActive ? '2px solid var(--accent)' : '1.5px solid var(--muted-foreground)',
                  transition: 'all 0.25s ease',
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              {/* Tooltip label */}
              <span
                style={{
                  position: 'absolute',
                  right: '1.25rem',
                  fontFamily: 'var(--font-mono-family)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--accent)' : 'var(--muted-foreground)',
                  whiteSpace: 'nowrap',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none',
                }}
              >
                {section.label}
              </span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
