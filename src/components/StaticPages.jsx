import React from 'react'
import { MonoLabel, Divider } from './Primitives'

const VERSION = '2026.2.1'

// ── Shared layout ─────────────────────────────────────────────────────────────
function PageShell({ title, label, children }) {
  return (
    <div className="anim-fade-in">
      <div style={{ paddingLeft: 18, marginBottom: 32, borderLeft: '3px solid var(--accent)' }}>
        <MonoLabel style={{ display: 'block', marginBottom: 8 }}>{label}</MonoLabel>
        <h2 style={{
          fontFamily: 'var(--display)', fontWeight: 800,
          fontSize: 'clamp(26px, 6vw, 40px)', letterSpacing: '-0.03em',
          color: 'var(--text)', lineHeight: 1, margin: 0,
        }}>{title}</h2>
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children, style }) {
  return <p style={{ marginBottom: 18, ...style }}>{children}</p>
}
function H({ children }) {
  return (
    <h3 style={{
      fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em',
      color: 'var(--text-dim)', textTransform: 'uppercase',
      marginTop: 32, marginBottom: 10,
    }}>{children}</h3>
  )
}
function A({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent-dim)',
    }}>{children}</a>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────
export function AboutPage({ onNavigate }) {
  return (
    <PageShell title="About DWELL" label={`v${VERSION}`}>
      <P>
        DWELL is a real-time transit intelligence app for Greater Boston, built on top of the{' '}
        <A href="https://api-v3.mbta.com/">MBTA API v3</A>. It lets you find a stop, watch live
        arrivals count down to the second, and save your most-used stops for instant access.
      </P>
      <P>
        The name comes from the transit industry term <em>dwell time</em> — the period a vehicle
        spends motionless at a platform. DWELL is built around that moment: the few seconds
        between arriving and departing, when information matters most.
      </P>

      <H>What it does</H>
      <P>
        Select a transit mode (Subway, Commuter Rail, or Bus), a route, and a stop. DWELL
        fetches live predictions from the MBTA and shows you exactly how many minutes until
        each departure — refreshing automatically every 20 seconds. Stops served by multiple
        lines surface a chip row so you can switch lines without leaving the board.
      </P>

      <H>Tech stack</H>
      <P>
        Built with React 18 and Vite. No runtime dependencies beyond React itself. Maps use
        OpenStreetMap tiles — no additional API key required. Favorites are stored in
        localStorage, so they persist between sessions without any account.
      </P>

      <H>Version</H>
      <P style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
        DWELL {VERSION} · MBTA API v3 · © {new Date().getFullYear()}
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

// ── Feedback ──────────────────────────────────────────────────────────────────
// Sends via Netlify serverless function so RESEND_API_KEY stays server-side.
// Set RESEND_API_KEY, FEEDBACK_TO_EMAIL, FEEDBACK_FROM_EMAIL in Netlify env vars.

const FEEDBACK_TO = import.meta.env.VITE_FEEDBACK_TO_EMAIL || 'feedback@yourdomain.com'

async function sendViaResend({ type, message }) {
  const res = await fetch('/.netlify/functions/send-feedback', {
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

export function FeedbackPage() {
  const [status, setStatus]   = React.useState('idle') // idle | sending | success | error
  const [errMsg, setErrMsg]   = React.useState('')
  const [form, setForm]       = React.useState({ type: 'bug', message: '' })
  const types = [
    { id: 'bug',     label: 'Bug report' },
    { id: 'feature', label: 'Feature request' },
    { id: 'data',    label: 'Data issue' },
    { id: 'other',   label: 'Other' },
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
      <PageShell title="Feedback" label="DWELL">
        <div style={{
          padding: '32px 24px', background: 'var(--bg-3)',
          border: '1px solid var(--border)', borderLeft: '3px solid var(--green)',
          borderRadius: 'var(--radius-md)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Feedback received
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
            Feedback sent successfully.
          </div>
          <button onClick={() => { setStatus('idle'); setForm({ type: 'bug', message: '' }) }}
            style={{
              padding: '8px 20px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.1em', cursor: 'pointer',
            }}
          >SEND ANOTHER</button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Feedback" label="DWELL">
      <P>
        Found a bug? Have a feature request? Something look off with the data?
        Use the form below to send us a message.
      </P>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
            style={{
              padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              background: form.type === t.id ? 'var(--accent)' : 'transparent',
              border: `1px solid ${form.type === t.id ? 'var(--accent)' : 'var(--border)'}`,
              color: form.type === t.id ? '#07080C' : 'var(--text-muted)',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em',
              transition: 'all 0.14s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Message */}
      <textarea
        value={form.message}
        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        placeholder="Describe the issue or idea…"
        rows={6}
        style={{
          width: '100%', background: 'var(--bg-3)',
          border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text)',
          fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.6,
          padding: '12px 16px', outline: 'none', resize: 'vertical',
          marginBottom: 16,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      {/* Error state */}
      {status === 'error' && (
        <div style={{
          padding: '10px 14px', marginBottom: 14,
          background: 'rgba(232,80,74,0.08)', border: '1px solid rgba(232,80,74,0.3)',
          borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
        }}>
          ⚠ {errMsg || 'Send failed — please try again.'}
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={status === 'sending' || !form.message.trim()}
        style={{
          padding: '12px 28px', background: 'var(--accent)', color: 'var(--accent-text)',
          border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: status === 'sending' || !form.message.trim() ? 'default' : 'pointer',
          fontFamily: 'var(--display)', fontSize: 14, fontWeight: 800,
          letterSpacing: '0.06em', transition: 'opacity 0.14s',
          opacity: form.message.trim() && status !== 'sending' ? 1 : 0.4,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
        onMouseEnter={e => { if (form.message.trim() && status !== 'sending') e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = form.message.trim() && status !== 'sending' ? '1' : '0.4' }}
      >
        {status === 'sending' ? 'SENDING…' : 'SEND FEEDBACK →'}
      </button>
    </PageShell>
  )
}

// ── Privacy Policy ────────────────────────────────────────────────────────────
export function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" label={`Effective ${new Date().getFullYear()}`}>
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
        This data never leaves your device.
      </P>
      <H>Feedback form</H>
      <P>
        If you submit feedback, your message is sent to us via Resend.
        We only receive the text you type — no IP address, device info, or identifying data is attached.
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
