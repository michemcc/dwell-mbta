import React, { useState, useEffect } from 'react'

// Cookie consent banner — lightweight, dismissible, GDPR-aware
// Preference stored in localStorage so it only shows once.
export default function CookieBanner({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dwell_cookie_consent')
      if (!stored) setVisible(true)
    } catch {}
  }, [])

  const dismiss = (choice) => {
    try { localStorage.setItem('dwell_cookie_consent', choice) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 600,
      display: 'flex', justifyContent: 'center',
      padding: '0 16px',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', maxWidth: 680,
        background: 'rgba(7,9,16,0.97)',
        border: '1px solid rgba(245,206,62,0.25)',
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,206,62,0.1)',
        pointerEvents: 'all',
        animation: 'fadeUp 0.3s ease both',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🍪</span>
        <p style={{
          flex: 1, fontFamily: 'var(--sans)', fontSize: 13,
          color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, minWidth: 200,
        }}>
          DWELL uses cookies for analytics and advertising (via Google AdSense). No personal data is sold.{' '}
          <button onClick={() => onNavigate('cookies')} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', fontFamily: 'inherit', fontSize: 'inherit',
            textDecoration: 'underline',
          }}>Cookie Policy</button>
        </p>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => dismiss('declined')} style={{
            padding: '7px 14px', background: 'transparent',
            border: '1px solid var(--border-mid)', borderRadius: 6,
            color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 10,
            letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.14s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-dim)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-dim)' }}
          >DECLINE</button>
          <button onClick={() => dismiss('accepted')} style={{
            padding: '7px 16px', background: 'var(--accent)',
            border: '1px solid var(--accent)', borderRadius: 6,
            color: 'var(--accent-text)', fontFamily: 'var(--mono)', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.14s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >ACCEPT</button>
        </div>
      </div>
    </div>
  )
}
