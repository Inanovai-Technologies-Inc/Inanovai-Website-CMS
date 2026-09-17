import { useState } from 'react'
import logoSrc from '../imports/image.png'
import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <nav
      style={{
        fontFamily: 'var(--font-display-family)',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'color-mix(in srgb, var(--background) 95%, transparent)',
      }}
      className="sticky top-0 z-50 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <a href="#" className="flex items-center">
          <img
            src={logoSrc}
            alt="iNanovai Technologies"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
            }}
          />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Services', href: '#services' },
            { label: 'Why Us', href: '#why-us' },
            { label: 'Careers', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'About', href: '#contact' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)'
              e.currentTarget.style.borderColor = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted-foreground)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <a
            href="#contact"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--accent-foreground)',
              backgroundColor: 'var(--accent)',
              padding: '0.5rem 1.125rem',
              borderRadius: 'var(--radius)',
              letterSpacing: '0.01em',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Book a Call
          </a>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            className="p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span style={{ backgroundColor: 'var(--foreground)', height: '1.5px', display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ backgroundColor: 'var(--foreground)', height: '1.5px', display: 'block', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ backgroundColor: 'var(--foreground)', height: '1.5px', display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
          className="md:hidden px-6 py-4 flex flex-col gap-4"
        >
          {[
            { label: 'Services', href: '#services' },
            { label: 'Why Us', href: '#why-us' },
            { label: 'Careers', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'About', href: '#contact' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--foreground)' }}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--accent-foreground)',
              backgroundColor: 'var(--accent)',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
            }}
            onClick={() => setMenuOpen(false)}
          >
            Book a Call
          </a>
        </div>
      )}
    </nav>
  )
}
