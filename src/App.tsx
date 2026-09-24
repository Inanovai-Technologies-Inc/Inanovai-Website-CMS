import Nav from './components/Nav'
import Hero from './components/Hero'
import Anju from './components/Anju'
import Services from './components/Services'
import WhyUs from './components/WhyUs'
import DemoSection from './components/DemoSection'
import CareersPage from './components/CareersPage'
import BlogPage from './components/BlogPage'
import BlogPostPage from './components/BlogPostPage'
import AboutPage from './components/AboutPage'
import Contact from './components/Contact'
import Footer from './components/Footer'
import NotFoundPage from './components/NotFoundPage'
import ServiceDetailPage from './components/ServiceDetailPage'
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
  const isAbout = path === '/about'
  const serviceSlug = path.startsWith('/services/') ? decodeURIComponent(path.slice('/services/'.length)) : null
  const isServiceDetail = Boolean(serviceSlug)
  // Unrecognized slugs under /blog/ or /services/ still resolve to their
  // respective detail pages, which show their own "not found" state — only
  // truly unknown top-level paths fall through to the site-wide 404.
  const isKnownRoute = isHome || isCareers || isBlogList || isBlogPost || isAbout || isServiceDetail
  const isStandalonePage = !isHome
  const routePage: RoutePage = isCareers
    ? 'careers'
    : isBlogList
    ? 'blog-list'
    : isBlogPost
    ? 'blog-post'
    : isAbout
    ? 'about'
    : isServiceDetail
    ? 'service-detail'
    : isKnownRoute
    ? 'home'
    : 'not-found'

  return (
    <ThemeProvider>
      <div style={{ fontFamily: 'var(--font-body-family)', backgroundColor: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', position: 'relative' }}>
        <BackgroundCanvas />
        {!isStandalonePage && <ScrollUI />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Nav path={path} navigate={navigate} />
          <main>
            {isCareers ? (
              <CareersPage />
            ) : isBlogList ? (
              <BlogPage navigate={navigate} />
            ) : isBlogPost && blogSlug ? (
              <BlogPostPage slug={blogSlug} navigate={navigate} />
            ) : isAbout ? (
              <AboutPage />
            ) : isServiceDetail && serviceSlug ? (
              <ServiceDetailPage slug={serviceSlug} navigate={navigate} />
            ) : isKnownRoute ? (
              <>
                <Hero />
                <Anju />
                <Services navigate={navigate} />
                <WhyUs />
                <DemoSection />
                <Contact />
              </>
            ) : (
              <NotFoundPage navigate={navigate} />
            )}
          </main>
          <Footer navigate={navigate} />
        </div>
        <Chatbot routePage={routePage} blogSlug={blogSlug} />
      </div>
    </ThemeProvider>
  )
}
