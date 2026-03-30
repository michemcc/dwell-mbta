import React from 'react'
import { MonoLabel } from './Primitives'

const VERSION = '2026.3.7'

// ── Section sub-nav (About / Feedback / Privacy) ──────────────────────────────
// Always visible within the About section so you can move between these pages
// without going back to the main nav. On mobile: horizontal pills at top.
// On desktop: rendered as the same horizontal pills (layout is narrow anyway).
function SectionNav({ current, onNavigate }) {
  const items = [
    { id: 'about',    label: 'About'    },
    { id: 'feedback', label: 'Feedback' },
    { id: 'privacy',  label: 'Privacy'  },
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
