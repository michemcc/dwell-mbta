import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MODES, getLineColor } from '../utils/mbta'
import { useRoutes, useStops } from '../hooks/index'
import { Spinner, MonoLabel, Pill, Divider, ErrorBox, SkeletonRow } from './Primitives'

function useScrollIntoView() {
  return useCallback((ref) => {
    if (!ref?.current) return
    setTimeout(() => {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])
}

function StepHeader({ number, label, completed, value, onReset }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: completed ? 'var(--accent)' : 'var(--bg-4)',
        border: `1.5px solid ${completed ? 'var(--accent)' : 'var(--border-mid)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
        color: completed ? '#07080C' : 'var(--text-dim)',
        transition: 'all 0.2s',
      }}>
        {completed ? '✓' : number}
      </div>
      <MonoLabel style={{ color: completed ? 'var(--text-muted)' : 'var(--text-dim)', flexShrink: 0 }}>
        {label}
      </MonoLabel>
      {completed && value && (
        <>
          <span style={{
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>{value}</span>
          <button onClick={onReset} style={{
            flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
            color: 'var(--text-dim)', background: 'transparent', border: 'none',
            cursor: 'pointer', padding: '2px 6px', transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
          >CHANGE</button>
        </>
      )}
    </div>
  )
}

function StepConnector({ active }) {
  return (
    <div style={{ marginLeft: 12, height: 22, display: 'flex', alignItems: 'stretch' }}>
      <div style={{
        width: 1.5, background: active ? 'var(--accent)' : 'var(--border)',
        transition: 'background 0.3s',
      }} />
    </div>
  )
}

function SearchInput({ value, onChange, placeholder, autoFocus }) {
  const ref = useRef(null)
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [autoFocus])
  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)', pointerEvents: 'none',
      }}>›</span>
      <input ref={ref} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--bg-3)',
          border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text)',
          fontFamily: 'var(--mono)', fontSize: 13, padding: '11px 36px 11px 30px',
          letterSpacing: '0.04em', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {value && (
        <button onClick={() => { onChange(''); ref.current?.focus() }} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--bg-4)', border: 'none', borderRadius: '50%',
          width: 20, height: 20, cursor: 'pointer', color: 'var(--text-muted)',
          fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      )}
    </div>
  )
}

function RouteStep({ mode, selected, onSelect }) {
  const { routes, loading, error } = useRoutes(mode)
  const [query, setQuery] = useState('')
  useEffect(() => setQuery(''), [mode?.id])
  const filtered = routes.filter(r => {
    const q = query.toLowerCase()
    return (r.attributes?.long_name || '').toLowerCase().includes(q) ||
      (r.attributes?.short_name || '').toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
  })
  return (
    <div className="anim-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {loading && <Spinner size={12} />}
        {!loading && routes.length > 0 && <MonoLabel style={{ color: 'var(--text-dim)' }}>{filtered.length} of {routes.length}</MonoLabel>}
      </div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search routes…" autoFocus />
      <ErrorBox message={error} style={{ marginBottom: 8 }} />
      <div style={{ maxHeight: 272, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-2)' }}>
        {loading && !routes.length ? [1,2,3,4].map(i => <SkeletonRow key={i} cols={[2.5,0.5]} />) :
         filtered.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>No routes match</div> :
         filtered.map(r => {
          const active = selected?.id === r.id
          const lc = getLineColor(r.id)
          const name = r.attributes?.long_name || r.attributes?.short_name || r.id
          const short = r.attributes?.short_name
          return (
            <button key={r.id} onClick={() => onSelect(r)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px 16px', background: active ? `${lc.accent}14` : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                borderLeft: `3px solid ${active ? lc.accent : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.14s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-3)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: active ? lc.accent : 'transparent',
                border: `2px solid ${active ? lc.accent : 'var(--border-mid)'}`,
                boxShadow: active ? `0 0 8px ${lc.accent}55` : 'none',
                transition: 'all 0.14s',
              }} />
              <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', color: active ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </span>
              {short && short !== name && <Pill color={lc.accent} style={{ flexShrink: 0 }}>{short}</Pill>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StopStep({ route, selected, onSelect }) {
  const { stops, loading, error } = useStops(route)
  const [query, setQuery] = useState('')
  const lc = getLineColor(route?.id)
  useEffect(() => setQuery(''), [route?.id])
  const filtered = stops.filter(s => (s.attributes?.name || '').toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="anim-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {loading && <Spinner size={12} />}
        {!loading && stops.length > 0 && <MonoLabel style={{ color: 'var(--text-dim)' }}>{filtered.length} of {stops.length}</MonoLabel>}
      </div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search stops…" autoFocus />
      <ErrorBox message={error} style={{ marginBottom: 8 }} />
      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-2)' }}>
        {loading && !stops.length ? [1,2,3,4,5].map(i => <SkeletonRow key={i} cols={[2,0.7]} />) :
         filtered.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>No stops match</div> :
         filtered.map(s => {
          const active = selected?.id === s.id
          return (
            <button key={s.id} onClick={() => onSelect(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '11px 16px', background: active ? `${lc.accent}12` : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                borderLeft: `3px solid ${active ? lc.accent : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.14s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-3)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 10, color: active ? lc.accent : 'var(--text-dim)', flexShrink: 0, transition: 'color 0.14s' }}>◆</span>
              <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', color: active ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.attributes?.name || s.id}
              </span>
              {s.attributes?.municipality && (
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', letterSpacing: '0.06em', flexShrink: 0 }}>
                  {s.attributes.municipality}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SelectorPanel({ onCommit }) {
  const [mode, setMode]   = useState(null)
  const [route, setRoute] = useState(null)
  const [stop, setStop]   = useState(null)

  const routeRef = useRef(null)
  const stopRef  = useRef(null)
  const ctaRef   = useRef(null)
  const scrollTo = useScrollIntoView()

  const handleMode = m => {
    const changing = mode?.id !== m.id
    setMode(m); setRoute(null); setStop(null)
    if (changing) scrollTo(routeRef)
  }
  const handleRoute = r => {
    const changing = route?.id !== r.id
    setRoute(r); setStop(null)
    if (changing) scrollTo(stopRef)
  }
  const handleStop = s => {
    setStop(s)
    scrollTo(ctaRef)
  }

  const canCommit = !!(mode && route && stop)

  return (
    <div>
      {/* Step 1 */}
      <StepHeader number="1" label="Mode" completed={!!mode} value={mode?.label}
        onReset={() => { setMode(null); setRoute(null); setStop(null) }} />
      {!mode
        ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 10 }}>
            {MODES.map((m, i) => (
              <button key={m.id} onClick={() => handleMode(m)} className="anim-fade-up"
                style={{
                  animationDelay: `${i*0.05}s`,
                  display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px',
                  cursor: 'pointer', background: 'var(--bg-3)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.18s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = 'rgba(240,204,74,0.07)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(240,204,74,0.12)'
                  e.currentTarget.querySelector('.mode-label').style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--bg-3)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.querySelector('.mode-label').style.color = 'var(--text-muted)'
                }}
              >
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div className="mode-label" style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '-0.01em', transition: 'color 0.18s' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>{m.description}</div>
              </button>
            ))}
          </div>
        )
        : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => handleMode(m)} style={{
                padding: '5px 14px', borderRadius: 999,
                background: mode?.id === m.id ? 'var(--accent)' : 'transparent',
                border: `1px solid ${mode?.id === m.id ? 'var(--accent)' : 'var(--border)'}`,
                color: mode?.id === m.id ? '#07080C' : 'var(--text-muted)',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
                cursor: 'pointer', transition: 'all 0.14s',
              }}>{m.label}</button>
            ))}
          </div>
        )
      }

      <StepConnector active={!!mode} />

      {/* Step 2 */}
      <div ref={routeRef} style={{ scrollMarginTop: 72 }}>
        <StepHeader number="2" label="Route" completed={!!route}
          value={route?.attributes?.long_name || route?.attributes?.short_name || route?.id}
          onReset={() => { setRoute(null); setStop(null) }} />
        {mode && !route && <RouteStep mode={mode} selected={route} onSelect={handleRoute} />}
        {!mode && <div style={{ padding: '10px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Select a mode first</div>}
      </div>

      <StepConnector active={!!route} />

      {/* Step 3 */}
      <div ref={stopRef} style={{ scrollMarginTop: 72 }}>
        <StepHeader number="3" label="Stop" completed={!!stop}
          value={stop?.attributes?.name}
          onReset={() => setStop(null)} />
        {route && !stop && <StopStep route={route} selected={stop} onSelect={handleStop} />}
        {!route && <div style={{ padding: '10px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Select a route first</div>}
      </div>

      <StepConnector active={!!stop} />

      {/* CTA */}
      <div ref={ctaRef} style={{ scrollMarginTop: 72 }}>
        {canCommit ? (
          <div className="anim-fade-up">
            <div style={{
              padding: '20px 22px', background: 'var(--bg-3)',
              border: '1px solid var(--border-mid)', borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
            }}>
              <MonoLabel style={{ display: 'block', marginBottom: 8 }}>Ready</MonoLabel>
              <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(16px,3.5vw,22px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4 }}>
                {stop.attributes?.name}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 16 }}>
                {mode.label} · {route.attributes?.long_name || route.id}
                {stop.attributes?.municipality ? ` · ${stop.attributes.municipality}` : ''}
              </div>
              <button onClick={() => onCommit({ mode, route, stop })}
                style={{
                  width: '100%', padding: '13px 0', background: 'var(--accent)', color: '#07080C',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800, letterSpacing: '0.06em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.14s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                VIEW ARRIVALS <span style={{ fontSize: 18 }}>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
            {!mode ? 'Select a mode to begin' : !route ? 'Select a route' : 'Select a stop'}
          </div>
        )}
      </div>
    </div>
  )
}
