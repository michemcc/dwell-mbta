import React, { useState, useEffect } from 'react'

// ── Scanlines ─────────────────────────────────────────────────────────────────
export function Scanlines() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998,
      background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.018) 3px,rgba(0,0,0,0.018) 4px)',
    }} />
  )
}

// ── Terminal Spinner ──────────────────────────────────────────────────────────
const FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
export function Spinner({ size = 14, color = 'var(--accent)' }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setF(n => (n + 1) % FRAMES.length), 80)
    return () => clearInterval(t)
  }, [])
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: size, color, lineHeight: 1 }}>
      {FRAMES[f]}
    </span>
  )
}

// ── Live Dot ──────────────────────────────────────────────────────────────────
export function LiveDot({ color = '#3DBA7F', size = 8 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.4,
        animation: 'pulse-dot 2s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: '20%', borderRadius: '50%', background: color,
      }} />
    </span>
  )
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
export function SkeletonRow({ cols = [2, 1, 0.6] }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      {cols.map((w, i) => (
        <div key={i} className="skeleton" style={{ flex: w, height: 14, borderRadius: 3 }} />
      ))}
    </div>
  )
}

// ── Mono Label ────────────────────────────────────────────────────────────────
export function MonoLabel({ children, style }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em',
      color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500,
      ...style,
    }}>
      {children}
    </span>
  )
}

// ── Pill Badge ────────────────────────────────────────────────────────────────
export function Pill({ children, color = 'var(--accent)', bg, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em',
      color: color,
      background: bg || `${color}18`,
      border: `1px solid ${color}33`,
      ...style,
    }}>
      {children}
    </span>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <div style={{ height: 1, background: 'var(--border)', ...style }} />
}

// ── Error Box ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message, style }) {
  if (!message) return null
  return (
    <div style={{
      padding: '12px 16px', borderLeft: '3px solid var(--red)',
      background: 'rgba(232,80,74,0.07)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
      fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', letterSpacing: '0.04em',
      lineHeight: 1.5,
      ...style,
    }}>
      ⚠ {message}
    </div>
  )
}
