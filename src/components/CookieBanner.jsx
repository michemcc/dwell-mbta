import React, { useState, useEffect } from 'react'

export default function CookieBanner({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('dwell_cookie_consent')) setVisible(true)
    } catch {}
  }, [])

  const dismiss = (choice) => {
    try { localStorage.setItem('dwell_cookie_consent', choice) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 68, left: 0, right: 0, zIndex: 600,
      display: 'flex', justifyContent: 'center',
      padding: '0 12px',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', maxWidth: 700,
        background: '#0F1320',
        border: '1px solid rgba(245,206,62,0.35)',
        borderRadius: 12,
        padding: '18px 22px',
        display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,206,62,0.08)',
        pointerEvents: 'all',
        animation: 'fadeUp 0.3s ease both',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>🍪</span>
          <span style={{
            fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', color: '#F4F5F7',
          }}>This site uses cookies</span>
        </div>

        {/* Body text — larger, full contrast */}
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 400,
          color: '#C8CFDF', lineHeight: 1.65, margin: 0,
        }}>
          DWELL displays ads via Google AdSense, which uses cookies to show relevant advertising.
          We also store your saved stops and preferences locally on your device.
          No personal data is sold or shared. Read our{' '}
          <button onClick={() => onNavigate('cookies')} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', fontFamily: 'inherit', fontSize: 'inherit',
            fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Cookie Policy</button>
          {' '}for full details.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={() => dismiss('declined')} style={{
            padding: '9px 18px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 7,
            color: '#9AA0B4',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.14s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9AA0B4'; e.currentTarget.style.color = '#C8CFDF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#9AA0B4' }}
          >Decline</button>
          <button onClick={() => dismiss('accepted')} style={{
            padding: '9px 22px',
            background: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: 7,
            color: '#03040A',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', cursor: 'pointer', transition: 'opacity 0.14s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Accept All</button>
        </div>
      </div>
    </div>
  )
}
