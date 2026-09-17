import Nav from './components/Nav'
import Hero from './components/Hero'
import Anju from './components/Anju'
import Services from './components/Services'
import WhyUs from './components/WhyUs'
import DemoSection from './components/DemoSection'
import Contact from './components/Contact'
import ScrollUI from './components/ScrollUI'
import BackgroundCanvas from './components/BackgroundCanvas'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <div style={{ fontFamily: 'var(--font-body-family)', backgroundColor: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', position: 'relative' }}>
        <BackgroundCanvas />
        <ScrollUI />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Nav />
          <main>
            <Hero />
            <Anju />
            <Services />
            <WhyUs />
            <DemoSection />
            <Contact />
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
