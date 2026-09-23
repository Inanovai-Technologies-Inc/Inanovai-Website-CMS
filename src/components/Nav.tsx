import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import logoSrc from '../imports/image.png'
import { useTheme } from '../context/ThemeContext'
import Button from './motion/Button'

const MOBILE_MENU_ID = 'primary-navigation'

// One source of truth for both the desktop row and the mobile sheet, so the
// two can't drift apart. `target` is a section id on the homepage; `href` is
// a dedicated route. null target with no href means the item has no
// destination yet and stays a placeholder.
const NAV_ITEMS: { label: string; target: string | null; href?: string }[] = [
  { label: 'Services', target: 'services' },
  { label: 'Why Us', target: 'why-us' },
  { label: 'Careers', target: null, href: '/careers' },
  { label: 'Blog', target: null, href: '/blog' },
  // Company details (legal name, location, website, specialties) live in the
  // contact footer, so About points there rather than at a new page.
  { label: 'About', target: 'contact' },
]

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// scrollIntoView honours the scroll-margin-top the sections declare in CSS,
// so targets clear the sticky navbar instead of hiding underneath it.
function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

type NavProps = { path: string; navigate: (to: string) => void }

export default function Nav({ path, navigate }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const shouldReduceMotion = useReducedMotion()

  // Close the sheet on Escape, and when the viewport grows into the desktop
  // layout, so the two navigations never end up in conflicting states.
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 768px)')
    const onChange = () => desktop.matches && setMenuOpen(false)

    window.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onChange)
    }
  }, [menuOpen])

  // Section links target ids on the homepage. From another route, navigate
  // home first and scroll once that content has mounted.
  const goTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (path !== '/') {
      navigate('/')
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id)))
      return
    }
    scrollToSection(id)
  }

  // The open sheet is part of the sticky navbar's flow, so closing it shifts
  // the page. Close first, then scroll once the layout has settled.
  const goToFromMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setMenuOpen(false)
    if (path !== '/') {
      navigate('/')
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id)))
      return
    }
    requestAnimationFrame(() => scrollToSection(id))
  }

  const goToPage = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    navigate(href)
  }

  const goToPageFromMenu = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setMenuOpen(false)
    navigate(href)
  }

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
        <a href="#hero" className="flex items-center" onClick={(e) => goTo(e, 'hero')}>
          <img
            src={logoSrc}
            alt="iNanovai Technologies"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain',
              // The logo file has no alpha channel, so its flat backdrop is
              // knocked out by blending: multiply drops white on light, while
              // invert + screen drops the (now black) backdrop on dark and
              // keeps hues via the 180° rotation.
              mixBlendMode: isDark ? 'screen' : 'multiply',
              filter: isDark ? 'invert(1) hue-rotate(180deg)' : undefined,
            }}
          />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => goToPage(e, item.href as string)}
                style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >
                {item.label}
              </a>
            ) : item.target ? (
              <a
                key={item.label}
                href={`#${item.target}`}
                onClick={(e) => goTo(e, item.target as string)}
                style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                title={`${item.label} — coming soon`}
                style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500, cursor: 'default', opacity: 0.6 }}
              >
                {item.label}
              </span>
            ),
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <motion.button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            transition={{ duration: 0.15 }}
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
          </motion.button>

          <Button
            as="a"
            href="#contact"
            variant="primary"
            onClick={(e) => goTo(e, 'contact')}
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1.125rem' }}
          >
            Book a Call
          </Button>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <motion.button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            transition={{ duration: 0.15 }}
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
          </motion.button>

          <motion.button
            className="p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span style={{ backgroundColor: 'var(--foreground)', height: '1.5px', display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ backgroundColor: 'var(--foreground)', height: '1.5px', display: 'block', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ backgroundColor: 'var(--foreground)', height: '1.5px', display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </div>
          </motion.button>
        </div>
      </div>

      {menuOpen && (
        <div
          id={MOBILE_MENU_ID}
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
          className="md:hidden px-6 py-4 flex flex-col gap-4"
        >
          {NAV_ITEMS.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--foreground)' }}
                onClick={(e) => goToPageFromMenu(e, item.href as string)}
              >
                {item.label}
              </a>
            ) : item.target ? (
              <a
                key={item.label}
                href={`#${item.target}`}
                style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--foreground)' }}
                onClick={(e) => goToFromMenu(e, item.target as string)}
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                title={`${item.label} — coming soon`}
                style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--muted-foreground)', opacity: 0.6 }}
              >
                {item.label}
              </span>
            ),
          )}
          <Button
            as="a"
            href="#contact"
            variant="primary"
            onClick={(e) => goToFromMenu(e, 'contact')}
            style={{ padding: '0.625rem 1.25rem', alignSelf: 'stretch' }}
          >
            Book a Call
          </Button>
        </div>
      )}
    </nav>
  )
}

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
