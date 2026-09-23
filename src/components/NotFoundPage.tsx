import { useEffect } from 'react'
import Reveal from './motion/Reveal'
import Button from './motion/Button'

type NotFoundPageProps = {
  navigate: (to: string) => void
}

export default function NotFoundPage({ navigate }: NotFoundPageProps) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Page not found — iNanovai Technologies'
    return () => { document.title = prevTitle }
  }, [])

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <Reveal className="max-w-3xl mx-auto px-6 py-32 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-mono-family)',
          fontSize: '0.75rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          fontWeight: 500,
          marginBottom: '1.5rem',
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display-family)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          color: 'var(--foreground)',
          marginBottom: '1rem',
        }}>
          This page doesn't exist.
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--muted-foreground)', maxWidth: '28rem', marginBottom: '2.5rem' }}>
          The link may be broken, or the page may have moved. Let's get you back on track.
        </p>
        <Button as="a" href="/" onClick={goHome} variant="primary" style={{ padding: '0.875rem 2rem' }}>
          Back to home
        </Button>
      </Reveal>
    </section>
  )
}
