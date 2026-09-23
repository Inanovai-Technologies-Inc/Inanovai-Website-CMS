import { useCallback, useEffect, useState } from 'react'

// Minimal client-side router: tracks window.location.pathname and updates it
// via the History API, without pulling in a routing library for two routes.
export function useRouter() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) {
      window.history.pushState(null, '', to)
    }
    setPath(to)
    window.scrollTo(0, 0)
  }, [])

  return { path, navigate }
}
