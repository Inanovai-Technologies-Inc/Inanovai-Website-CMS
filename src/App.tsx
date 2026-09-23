import Nav from './components/Nav'
import Hero from './components/Hero'
import Anju from './components/Anju'
import Services from './components/Services'
import WhyUs from './components/WhyUs'
import DemoSection from './components/DemoSection'
import CareersPage from './components/CareersPage'
import BlogPage from './components/BlogPage'
import BlogPostPage from './components/BlogPostPage'
import Contact from './components/Contact'
import NotFoundPage from './components/NotFoundPage'
import Chatbot, { type RoutePage } from './components/Chatbot'
import ScrollUI from './components/ScrollUI'
import BackgroundCanvas from './components/BackgroundCanvas'
import { ThemeProvider } from './context/ThemeContext'
import { useRouter } from './router'

export default function App() {
  const { path, navigate } = useRouter()
  const isHome = path === '/'
  const isCareers = path === '/careers'
  const isBlogList = path === '/blog'
  const blogSlug = path.startsWith('/blog/') ? decodeURIComponent(path.slice('/blog/'.length)) : null
  const isBlogPost = Boolean(blogSlug)
  // Unrecognized slugs under /blog/ still resolve to BlogPostPage, which
  // shows its own "Article not found" state — only truly unknown top-level
  // paths fall through to the site-wide 404.
  const isKnownRoute = isHome || isCareers || isBlogList || isBlogPost
  const isStandalonePage = !isHome
  const routePage: RoutePage = isCareers ? 'careers' : isBlogList ? 'blog-list' : isBlogPost ? 'blog-post' : isKnownRoute ? 'home' : 'not-found'

  return (
    <ThemeProvider>
      <div style={{ fontFamily: 'var(--font-body-family)', backgroundColor: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', position: 'relative' }}>
        <BackgroundCanvas />
        {!isStandalonePage && <ScrollUI />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Nav path={path} navigate={navigate} />
          <main>
            {isCareers ? (
              <CareersPage navigate={navigate} />
            ) : isBlogList ? (
              <BlogPage navigate={navigate} />
            ) : isBlogPost && blogSlug ? (
              <BlogPostPage slug={blogSlug} navigate={navigate} />
            ) : isKnownRoute ? (
              <>
                <Hero />
                <Anju />
                <Services />
                <WhyUs />
                <DemoSection />
                <Contact navigate={navigate} />
              </>
            ) : (
              <NotFoundPage navigate={navigate} />
            )}
          </main>
        </div>
        <Chatbot routePage={routePage} blogSlug={blogSlug} />
      </div>
    </ThemeProvider>
  )
}
