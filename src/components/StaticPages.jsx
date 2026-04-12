import React from 'react'
import { MonoLabel } from './Primitives'

const VERSION = '2026.3.8'

// ── Section sub-nav (About / Feedback / Privacy) ──────────────────────────────
// Always visible within the About section so you can move between these pages
// without going back to the main nav. On mobile: horizontal pills at top.
// On desktop: rendered as the same horizontal pills (layout is narrow anyway).
function SectionNav({ current, onNavigate }) {
  const items = [
    { id: 'about',    label: 'About'    },
    { id: 'feedback', label: 'Feedback' },
    { id: 'privacy',  label: 'Privacy'  },
    { id: 'terms',    label: 'Terms'    },
    { id: 'cookies',  label: 'Cookies'  },
  ]
  return (
    <div style={{
      display: 'flex', gap: 4, marginBottom: 32,
      background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', padding: 4,
    }}>
      {items.map(item => {
        const active = current === item.id
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            style={{
              flex: 1, padding: '9px 12px',
              background: active ? 'var(--bg)' : 'transparent',
              border: active ? '1px solid var(--border-mid)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.16s',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
            }}
          >{item.label}</button>
        )
      })}
    </div>
  )
}

// ── PageShell ─────────────────────────────────────────────────────────────────
function PageShell({ title, label, current, onNavigate, children }) {
  return (
    <div className="anim-fade-in">
      {/* Section sub-nav — always shown on About/Feedback/Privacy */}
      <SectionNav current={current} onNavigate={onNavigate} />

      {/* Page title */}
      <div style={{ paddingLeft: 20, marginBottom: 28, borderLeft: '3px solid var(--accent)' }}>
        <MonoLabel style={{ display: 'block', marginBottom: 8, fontSize: 10, letterSpacing: '0.18em' }}>{label}</MonoLabel>
        <h2 style={{
          fontFamily: 'var(--display)', fontWeight: 800,
          fontSize: 'clamp(28px, 6vw, 42px)', letterSpacing: '-0.03em',
          color: 'var(--text)', lineHeight: 1.05, margin: 0,
        }}>{title}</h2>
      </div>

      {/* Content */}
      <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children, style }) {
  return <p style={{ marginBottom: 20, fontFamily: 'var(--sans)', ...style }}>{children}</p>
}
function H({ children }) {
  return (
    <h3 style={{
      fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em',
      color: 'var(--accent)', textTransform: 'uppercase',
      marginTop: 36, marginBottom: 12, opacity: 0.85,
    }}>{children}</h3>
  )
}
function A({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      color: 'var(--accent)', textDecoration: 'none',
      borderBottom: '1px solid var(--accent-dim)',
      transition: 'border-color 0.14s',
    }}>{children}</a>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────
export function AboutPage({ onNavigate }) {
  return (
    <PageShell title="About DWELL" label={`v${VERSION}`} current="about" onNavigate={onNavigate}>
      <P>
        DWELL is a real-time MBTA transit dashboard for Greater Boston.
        Live predictions for subway, commuter rail, and bus — no account required, no ads, no tracking.
      </P>
      <H>How it works</H>
      <P>
        All data comes from the{' '}
        <A href="https://api-v3.mbta.com/">MBTA v3 API</A> — the same data the official MBTA
        app uses. Predictions update every 20 seconds. Service alerts appear instantly.
      </P>
      <H>Features</H>
      <P>
        Search any stop by name and jump straight to live arrivals. Browse by mode, line, and stop.
        Save favourite stops for one-tap access. Plan a trip between any two stations with
        live departure times and transfer suggestions. Switch between lines at shared stations with
        the line chips on the arrivals board.
      </P>
      <H>Independent project</H>
      <P>
        DWELL is not affiliated with or endorsed by the MBTA. It is an independent open-source
        project built for Boston commuters. If you find it useful,{' '}
        <A href="https://buymeacoffee.com/michemcc">buying a coffee</A> helps keep it running.
      </P>
      <H>Advertising</H>
      <P>
        DWELL is free to use and supported by advertising through Google AdSense.
        Ads are selected and served by Google and are clearly distinguished from content.
        DWELL does not endorse any advertised products. Revenue from ads covers server and
        domain costs. For more, see the{' '}
        <button onClick={() => onNavigate('terms')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', borderBottom: '1px solid var(--accent-dim)',
            fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
        >Terms of Service</button>{' '}and{' '}
        <button onClick={() => onNavigate('cookies')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', borderBottom: '1px solid var(--accent-dim)',
            fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
        >Cookie Policy</button>.
      </P>
      <H>Contact</H>
      <P>
        Found a bug or have a suggestion?{' '}
        <button onClick={() => onNavigate('feedback')}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', borderBottom: '1px solid var(--accent-dim)',
            fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit',
          }}
        >Send feedback</button>
        {' '}— it goes straight to the developer.
      </P>
    </PageShell>
  )
}

// ── Feedback ──────────────────────────────────────────────────────────────────
const FEEDBACK_TO = import.meta.env.VITE_FEEDBACK_TO_EMAIL || 'feedback@yourdomain.com'

async function sendViaResend({ type, message }) {
  const res = await fetch('/api/send-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, message, version: VERSION }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Send failed (' + res.status + ')')
  }
  return true
}

export function FeedbackPage({ onNavigate }) {
  const [status, setStatus] = React.useState('idle')
  const [errMsg, setErrMsg] = React.useState('')
  const [form, setForm]     = React.useState({ type: 'bug', message: '' })

  const types = [
    { id: 'bug',     label: 'Bug report'      },
    { id: 'feature', label: 'Feature request' },
    { id: 'data',    label: 'Data issue'      },
    { id: 'other',   label: 'Other'           },
  ]

  const handleSubmit = async () => {
    if (!form.message.trim()) return
    const typeLabel = types.find(t => t.id === form.type)?.label || form.type
    setStatus('sending')
    try {
      await sendViaResend({ type: typeLabel, message: form.message })
      setStatus('success')
    } catch (e) {
      setErrMsg(e.message)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="anim-fade-in">
        <SectionNav current="feedback" onNavigate={onNavigate} />
        <div style={{
          padding: '36px 28px', background: 'var(--bg-3)',
          border: '1px solid var(--border)', borderLeft: '3px solid var(--green)',
          borderRadius: 'var(--radius-md)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 14 }}>✓</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Feedback received
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
            Thanks — it goes straight to the developer.
          </div>
          <button onClick={() => { setStatus('idle'); setForm({ type: 'bug', message: '' }) }}
            style={{
              padding: '9px 22px', background: 'transparent',
              border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >SEND ANOTHER</button>
        </div>
      </div>
    )
  }

  return (
    <div className="anim-fade-in">
      <SectionNav current="feedback" onNavigate={onNavigate} />

      <div style={{ paddingLeft: 20, marginBottom: 28, borderLeft: '3px solid var(--accent)' }}>
        <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
        <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(28px,6vw,42px)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.05, margin: 0 }}>
          Feedback
        </h2>
      </div>

      <P>Found a bug? Have a feature request? Something look off with the data? Use the form below.</P>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
            style={{
              padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
              background: form.type === t.id ? 'var(--accent)' : 'transparent',
              border: `1px solid ${form.type === t.id ? 'var(--accent)' : 'var(--border-mid)'}`,
              color: form.type === t.id ? 'var(--accent-text)' : 'var(--text-muted)',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', transition: 'all 0.14s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Message */}
      <textarea
        value={form.message}
        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        placeholder="Describe the issue or idea in as much detail as you like…"
        rows={6}
        style={{
          width: '100%', background: 'var(--bg-3)',
          border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)',
          borderRadius: 'var(--radius-md)', color: 'var(--text)',
          fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.65,
          padding: '14px 16px', outline: 'none', resize: 'vertical',
          marginBottom: 16, transition: 'border-color 0.14s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      {/* Error */}
      {status === 'error' && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: 'rgba(240,85,85,0.08)', border: '1px solid rgba(240,85,85,0.3)',
          borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', lineHeight: 1.6,
        }}>
          ⚠ {errMsg || 'Send failed — please try again.'}
        </div>
      )}

      <button onClick={handleSubmit} disabled={status === 'sending' || !form.message.trim()}
        style={{
          padding: '13px 32px', background: 'var(--accent)', color: 'var(--accent-text)',
          border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: status === 'sending' || !form.message.trim() ? 'default' : 'pointer',
          fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800,
          letterSpacing: '0.06em', transition: 'opacity 0.14s',
          opacity: form.message.trim() && status !== 'sending' ? 1 : 0.4,
        }}
        onMouseEnter={e => { if (form.message.trim() && status !== 'sending') e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = form.message.trim() && status !== 'sending' ? '1' : '0.4' }}
      >
        {status === 'sending' ? 'SENDING…' : 'SEND FEEDBACK →'}
      </button>
    </div>
  )
}

// ── Privacy Policy ────────────────────────────────────────────────────────────
export function PrivacyPage({ onNavigate }) {
  return (
    <PageShell title="Privacy Policy" label={`Effective ${new Date().getFullYear()}`} current="privacy" onNavigate={onNavigate}>
      <P>
        DWELL is designed to respect your privacy. This policy explains what data is collected,
        what is not, and how the app operates.
      </P>
      <H>What we collect</H>
      <P>
        DWELL does not collect, store, or transmit any personal information.
        All transit data is fetched directly from the MBTA API and displayed in your browser.
        No analytics, tracking pixels, or third-party scripts are loaded.
      </P>
      <H>Local storage</H>
      <P>
        DWELL stores your saved stops and theme preference in your browser's local storage.
        This data never leaves your device and can be cleared at any time from your browser settings.
      </P>
      <H>Feedback form</H>
      <P>
        If you submit feedback, your message is sent to the developer via Resend.
        Only the text you type is transmitted — no IP address, device info, or identifying data is attached.
      </P>
      <H>Data source</H>
      <P>
        All transit data is provided by the{' '}
        <A href="https://www.mbta.com/">Massachusetts Bay Transportation Authority (MBTA)</A>.
        DWELL is an independent project and is not affiliated with or endorsed by the MBTA.
        Prediction accuracy depends on real-time vehicle reporting and may vary.
      </P>
    </PageShell>
  )
}

// ── Terms of Service ──────────────────────────────────────────────────────────
export function TermsPage({ onNavigate }) {
  return (
    <PageShell title="Terms of Service" label={`Effective January 1, 2025`} current="terms" onNavigate={onNavigate}>
      <P>
        By using DWELL at dwellmbta.com, you agree to these terms. Please read them carefully.
        If you do not agree, do not use the site.
      </P>
      <H>Use of the Service</H>
      <P>
        DWELL provides real-time MBTA transit information as a convenience. The service is provided
        free of charge and on an "as is" basis. You may use DWELL for personal, non-commercial
        purposes. You may not scrape, copy, redistribute, or build competing products using DWELL's
        interface or data presentation without written permission.
      </P>
      <H>Accuracy of Information</H>
      <P>
        All transit data is sourced from the MBTA v3 public API. DWELL makes no guarantee that
        arrival times, service alerts, or vehicle positions are accurate, complete, or current.
        Do not rely solely on DWELL for time-sensitive travel decisions. Always verify critical
        journey information through official MBTA channels.
      </P>
      <P>
        DWELL is not affiliated with, endorsed by, or officially connected to the Massachusetts
        Bay Transportation Authority (MBTA). The MBTA name, logo, and line colors are the property
        of the MBTA and are referenced here solely for informational purposes.
      </P>
      <H>Advertising</H>
      <P>
        DWELL displays advertisements served by Google AdSense. These ads are selected and delivered
        by Google based on your browsing activity and other signals. DWELL does not control which
        specific ads are shown. Revenue from advertising helps cover the costs of running the service.
      </P>
      <P>
        DWELL does not endorse any products or services advertised on the site. Clicking an
        advertisement takes you to a third-party site governed by that site's own terms and
        privacy policy.
      </P>
      <H>Limitation of Liability</H>
      <P>
        To the maximum extent permitted by applicable law, DWELL and its developer shall not be
        liable for any direct, indirect, incidental, or consequential damages arising from your
        use of the service, including missed transportation, incorrect journey information, or
        reliance on displayed predictions.
      </P>
      <H>Intellectual Property</H>
      <P>
        The DWELL name, design system, and original code are the property of the developer.
        The underlying transit data is owned by the MBTA and made available under the MBTA's
        public data license. Map tiles are provided by OpenStreetMap contributors under the
        Open Database License.
      </P>
      <H>Changes to These Terms</H>
      <P>
        These terms may be updated from time to time. Continued use of DWELL after any changes
        constitutes your acceptance of the revised terms. The effective date at the top of this
        page reflects the most recent revision.
      </P>
      <H>Contact</H>
      <P>
        Questions about these terms?{' '}
        <button onClick={() => onNavigate('feedback')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', borderBottom: '1px solid var(--accent-dim)',
            fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
        >Send us a message</button>.
      </P>
    </PageShell>
  )
}

// ── Cookie Policy ─────────────────────────────────────────────────────────────
export function CookiesPage({ onNavigate }) {
  return (
    <PageShell title="Cookie Policy" label={`Effective January 1, 2025`} current="cookies" onNavigate={onNavigate}>
      <P>
        This Cookie Policy explains how DWELL uses cookies and similar tracking technologies.
        By continuing to use the site after dismissing the cookie banner, you consent to the
        use of cookies as described here.
      </P>
      <H>What Are Cookies?</H>
      <P>
        Cookies are small text files stored in your browser when you visit a website. They are
        widely used to make websites work, remember your preferences, and provide information
        to site owners and advertisers.
      </P>
      <H>Cookies DWELL Sets</H>
      <P>
        DWELL sets one first-party cookie: "dwell_cookie_consent", which stores your cookie
        preference (accepted or declined) so the banner does not reappear on subsequent visits.
        This cookie contains no personal information and expires after one year.
      </P>
      <P>
        DWELL also stores data in your browser's local storage (not a cookie, but similar) to
        save your favourite stops and theme preference. This data never leaves your device and
        is not accessible to any third party.
      </P>
      <H>Google AdSense Cookies</H>
      <P>
        DWELL uses Google AdSense to display advertisements. Google AdSense sets cookies to
        show relevant ads based on your browsing activity on DWELL and other websites. These
        cookies are set by Google's domains and are governed by Google's Privacy Policy.
      </P>
      <P>
        Google may use the DoubleClick cookie to serve ads and track conversions. You can opt
        out of personalised advertising by visiting{' '}
        <A href="https://www.google.com/settings/ads">Google's Ad Settings</A> or by visiting{' '}
        <A href="http://www.aboutads.info/choices/">aboutads.info</A>.
      </P>
      <H>How to Manage Cookies</H>
      <P>
        You can control cookies through your browser settings. Most browsers allow you to
        block or delete cookies entirely. Note that blocking all cookies may affect the
        functionality of DWELL and many other websites.
      </P>
      <P>
        To opt out of Google Analytics and AdSense cookies specifically, you can install the{' '}
        <A href="https://tools.google.com/dlpage/gaoptout">Google Analytics opt-out browser add-on</A>.
      </P>
      <H>Changes to This Policy</H>
      <P>
        This Cookie Policy may be updated as our use of cookies changes. The effective date at
        the top reflects the most recent revision. Continued use of DWELL constitutes acceptance
        of the updated policy.
      </P>
      <H>Contact</H>
      <P>
        Questions about cookies?{' '}
        <button onClick={() => onNavigate('feedback')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', borderBottom: '1px solid var(--accent-dim)',
            fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
        >Get in touch</button>.
      </P>
    </PageShell>
  )
}
