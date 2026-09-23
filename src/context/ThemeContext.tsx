import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const STORAGE_KEY = 'inanovai-theme'

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {} })

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) — fall through.
  }

  // Dark is the brand's primary experience; a visitor with no saved
  // preference gets it regardless of OS setting. An explicit light
  // preference is still respected once they toggle (and is then stored).
  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persisting is best-effort; the toggle still works for this session.
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
