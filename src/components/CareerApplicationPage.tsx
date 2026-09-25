import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { STRAPI_URL } from '../config'
import Card from './motion/Card'
import Reveal from './motion/Reveal'
import Button from './motion/Button'

const CAREERS_ENDPOINT = `${STRAPI_URL}/api/careers`
const APPLICATION_SUBMIT_ENDPOINT = `${STRAPI_URL}/api/applications/submit`

type CareerFields = {
  title?: string
  slug?: string
  location?: string
  employmentType?: string
  experience?: string
  description?: string
  isActive?: boolean
}

type CareerEntry = CareerFields & {
  id: number
  documentId?: string
  attributes?: CareerFields
}

type StrapiCareerResponse = {
  data?: CareerEntry | CareerEntry[] | null
}

type Career = {
  title: string
  location: string
  employmentType: string
  experience: string
  description: string
}

function normalizeCareer(entry: CareerEntry): Career {
  const fields = entry.attributes ?? entry

  return {
    title: fields.title ?? 'Open Position',
    location: fields.location ?? '',
    employmentType: fields.employmentType ?? '',
    experience: fields.experience ?? '',
    description: fields.description ?? '',
  }
}

function getSlugFromPathname(): string {
  const pathname = window.location.pathname
  const prefix = '/careers/'
  const suffix = '/apply'

  if (!pathname.startsWith(prefix) || !pathname.endsWith(suffix)) return ''
  return decodeURIComponent(pathname.slice(prefix.length, -suffix.length))
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.6875rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  fontWeight: 500,
  marginBottom: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono-family)',
  fontSize: '0.625rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
  display: 'block',
  marginBottom: '0.5rem',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem 0.875rem',
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  backgroundColor: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-body-family)',
  outline: 'none',
}

function BackToCareers() {
  return (
    <Button
      as="a"
      href="/careers"
      variant="secondary"
      style={{
        fontFamily: 'var(--font-mono-family)',
        fontSize: '0.625rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.625rem 1rem',
      }}
    >
      Back to Careers
    </Button>
  )
}

function StatusMessage({ children, warm = false }: { children: string; warm?: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${warm ? 'color-mix(in srgb, var(--accent-warm) 30%, transparent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '2.5rem',
        color: warm ? 'var(--accent-warm)' : 'var(--muted-foreground)',
        fontFamily: 'var(--font-mono-family)',
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

export default function CareerApplicationPage() {
  const slug = getSlugFromPathname()
  const [career, setCareer] = useState<Career | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCareer() {
      if (!slug) {
        setCareer(null)
        setLoading(false)
        return
      }

      try {
        const query = new URLSearchParams({
          'filters[slug][$eq]': slug,
          'filters[isActive][$eq]': 'true',
          'pagination[pageSize]': '1',
        })
        const response = await fetch(`${CAREERS_ENDPOINT}?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`)

        const payload: StrapiCareerResponse = await response.json()
        const entry = Array.isArray(payload.data) ? payload.data[0] : payload.data
        setCareer(entry ? normalizeCareer(entry) : null)
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setCareer(null)
        setError(err instanceof Error ? err.message : 'Unable to reach the careers service.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadCareer()
    return () => controller.abort()
  }, [slug])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting || submitted) return

    const form = event.currentTarget
    setSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData(form)
      formData.set('career', slug)

      const response = await fetch(APPLICATION_SUBMIT_ENDPOINT, {
        method: 'POST',
        body: formData,
      })
      const payload: { success?: boolean; saved?: boolean; notificationFailed?: boolean; error?: string } = await response.json().catch(() => ({}))

      if (response.status === 201 && payload.success) {
        form.reset()
        setSubmitted(true)
        return
      }

      if (response.status === 502 && payload.saved) {
        throw new Error('Your application was saved, but the notification could not be sent. Please contact us if you do not receive confirmation soon.')
      }

      const statusMessage = response.status === 400
        ? 'Please check the required fields and your resume file.'
        : response.status === 404
          ? 'This position is no longer available. Please return to Careers and choose another role.'
          : response.status === 413
            ? 'Your resume is too large. Please upload a file smaller than 5 MB.'
            : response.status === 500
              ? 'We could not save your application right now. Please try again.'
              : response.status === 502
                ? 'Your application could not be completed because the notification service is unavailable. Please try again later.'
                : `Request failed with status ${response.status}.`

      throw new Error(payload.error || statusMessage)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <Reveal className="mb-10">
          <BackToCareers />
        </Reveal>

        {loading && <StatusMessage>Loading position...</StatusMessage>}

        {!loading && error && (
          <div className="flex flex-col gap-6">
            <StatusMessage warm>Could not load this position. {error}</StatusMessage>
            <div><BackToCareers /></div>
          </div>
        )}

        {!loading && !error && !career && (
          <div className="flex flex-col gap-6">
            <StatusMessage>This position is no longer available or could not be found.</StatusMessage>
            <div><BackToCareers /></div>
          </div>
        )}

        {!loading && !error && career && (
          <>
            <Reveal className="max-w-3xl mb-14">
              <div style={eyebrowStyle}>
                <span style={{ display: 'inline-block', width: '2rem', height: '1px', backgroundColor: 'var(--accent)' }} />
                APPLY NOW
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display-family)',
                  fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.05,
                  color: 'var(--foreground)',
                  marginBottom: '1.5rem',
                }}
              >
                {career.title}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono-family)', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {career.location && <span>{career.location}</span>}
                {career.employmentType && <span>{career.employmentType}</span>}
                {career.experience && <span>{career.experience}</span>}
              </div>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
              <Reveal className="lg:col-span-2">
                <div style={{ paddingTop: '0.25rem' }}>
                  <div style={labelStyle}>About the role</div>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {career.description || 'We are looking for a thoughtful, capable person to join our team.'}
                  </p>
                </div>
              </Reveal>

              <Reveal className="lg:col-span-3 lg:-mt-1" delay={0.08}>
                <Card as="div" style={{ width: '100%', padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
                  <style>{`
                    .career-application-form .career-application-input:focus {
                      border-color: var(--accent);
                      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
                    }

                    .career-application-form .career-application-file::file-selector-button {
                      margin: -0.125rem 0.75rem -0.125rem -0.125rem;
                      padding: 0.375rem 0.625rem;
                      border: 1px solid var(--border);
                      border-radius: var(--radius);
                      background: var(--muted);
                      color: var(--foreground);
                      font: 500 0.6875rem var(--font-mono-family);
                      cursor: pointer;
                    }
                  `}</style>
                  {submitted ? (
                    <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '1rem' }}>✓</div>
                      <h2 style={{ fontFamily: 'var(--font-display-family)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.625rem' }}>
                        Application submitted successfully
                      </h2>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                        Thank you for applying. Our team will review your application and be in touch.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="career-application-form flex flex-col gap-4">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display-family)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                        Start your application
                      </h2>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        Share a few details about yourself and your experience.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="application-full-name" style={labelStyle}>Full Name *</label>
                        <input className="career-application-input" id="application-full-name" name="fullName" type="text" required style={inputStyle} />
                      </div>

                      <div>
                        <label htmlFor="application-email" style={labelStyle}>Email *</label>
                        <input className="career-application-input" id="application-email" name="email" type="email" required style={inputStyle} />
                      </div>

                      <div>
                        <label htmlFor="application-phone" style={labelStyle}>Phone</label>
                        <input className="career-application-input" id="application-phone" name="phone" type="tel" style={inputStyle} />
                      </div>

                      <div>
                        <label htmlFor="application-resume" style={labelStyle}>Resume *</label>
                        <input className="career-application-input career-application-file" id="application-resume" name="resume" type="file" required accept=".pdf,.doc,.docx" style={{ ...inputStyle, padding: '0.625rem 0.75rem' }} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="application-cover-message" style={labelStyle}>Cover Message</label>
                      <textarea className="career-application-input" id="application-cover-message" name="coverMessage" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>

                      {submitError && (
                        <div
                          role="alert"
                          style={{
                            color: 'var(--accent-warm)',
                            border: '1px solid color-mix(in srgb, var(--accent-warm) 30%, transparent)',
                            borderRadius: 'var(--radius)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.8125rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {submitError}
                        </div>
                      )}

                      <Button
                        as="button"
                        type="submit"
                        variant="primary"
                        aria-disabled={submitting}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '0.625rem 1.25rem',
                          fontSize: '0.75rem',
                          opacity: submitting ? 0.65 : 1,
                          pointerEvents: submitting ? 'none' : 'auto',
                        }}
                      >
                        {submitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </form>
                  )}
                </Card>
              </Reveal>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
