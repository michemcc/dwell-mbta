import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useClock, useFavorites, useStopSearch, useTheme } from './hooks/index'
import { getLineColor, mbtaFetch } from './utils/mbta'
import SelectorPanel from './components/SelectorPanel'
import FavoritesPanel from './components/FavoritesPanel'
import ArrivalsBoard from './components/ArrivalsBoard'
import NextTrain from './components/NextTrain'
import { AboutPage, FeedbackPage, PrivacyPage } from './components/StaticPages'
import { Scanlines, LiveDot, MonoLabel, Spinner, Pill } from './components/Primitives'

const VERSION = '2026.3.7'
const DONATE_URL = 'https://buymeacoffee.com/michemcc'

// ── QuickSearch — stop search, instant commit, no route-picking step ────────
// Selecting a stop immediately fetches its routes and navigates to arrivals.
// The route-picker second step has been removed — faster for commuters.
function QuickSearch({ onCommit, autoFocus }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const { results, loading } = useStopSearch(query)
  const ref      = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 120)
  }, [autoFocus])

  // Selecting a stop: fetch its routes, pick best one, commit immediately
  const handleSelect = useCallback(async (rawStop) => {
    setOpen(false)
    setQuery(rawStop.attributes?.name || '')
    try {
      // CRITICAL: resolve to the parent station if the cache returned a child stop.
      // Child stops (platform-level, location_type=0) only serve one direction/route.
      // Parent stations (location_type=1, e.g. "place-dwnxg") serve ALL routes at that stop.
      // Without this, Downtown Crossing only shows Red Line in one direction,
      // and the Orange Line chip never appears.
      const parentId = rawStop.relationships?.parent_station?.data?.id
      let stop = rawStop
      if (parentId) {
        try {
          const pd = await mbtaFetch(`/stops/${parentId}`)
          if (pd.data) stop = pd.data
        } catch { /* keep rawStop if parent fetch fails */ }
      }

      const d      = await mbtaFetch(`/routes?filter[stop]=${stop.id}&sort=sort_order`)
      const routes = d.data || []
      if (!routes.length) return
      // Prefer subway first, then CR, then bus
      const route = [...routes].sort((a, b) => (a.attributes?.type ?? 9) - (b.attributes?.type ?? 9))[0]
      const type  = route.attributes?.type ?? 3
      const MODES = {
        0: { id:'subway',   label:'Subway',        shortLabel:'SWY', routeTypes:'0,1', icon:'⬡', description:'' },
        1: { id:'subway',   label:'Subway',        shortLabel:'SWY', routeTypes:'0,1', icon:'⬡', description:'' },
        2: { id:'commuter', label:'Commuter Rail',  shortLabel:'CRL', routeTypes:'2',   icon:'◈', description:'' },
        3: { id:'bus',      label:'Bus',            shortLabel:'BUS', routeTypes:'3',   icon:'◎', description:'' },
      }
      onCommit({ mode: MODES[type] || MODES[3], route, stop })
    } catch {}
    setQuery('')
  }, [onCommit])

  const clear = () => { setQuery(''); setOpen(false) }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 16, pointerEvents: 'none',
        }}>›</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          placeholder="Type any stop name — Park Street, Salem, Downtown Crossing…"
          style={{
            width: '100%', background: 'var(--bg-3)',
            border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)',
            borderRadius: 'var(--radius-md)', color: 'var(--text)',
            fontFamily: 'var(--mono)', fontSize: 14, padding: '14px 44px 14px 34px',
            letterSpacing: '0.03em', outline: 'none',
            transition: 'border-color 0.16s, box-shadow 0.16s',
            boxShadow: 'none',
          }}
          onFocus={e => {
            setOpen(true)
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.boxShadow = '0 0 0 3px rgba(242,202,69,0.1)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border)'
            e.target.style.boxShadow = 'none'
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') { clear(); e.target.blur() }
            // Enter on first result
            if (e.key === 'Enter' && results.length > 0) handleSelect(results[0])
          }}
        />
        {query && (
          <button onMouseDown={e => { e.preventDefault(); clear() }} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--bg-4)', border: 'none', borderRadius: '50%',
            width: 22, height: 22, cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-md)', zIndex: 400,
          boxShadow: '0 8px 32px var(--shadow)', overflow: 'hidden',
          maxHeight: 320, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Spinner size={12} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Searching…</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>
              No stops match "{query}"
            </div>
          )}
          {results.map((stop, i) => (
            <button
              key={stop.id}
              onMouseDown={e => { e.preventDefault(); handleSelect(stop) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px 16px', background: i === 0 ? 'rgba(240,204,74,0.04)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 ? 'rgba(240,204,74,0.04)' : 'transparent'}
            >
              <span style={{ fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>◆</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stop.attributes?.name}
                </div>
                {stop.attributes?.municipality && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.04em' }}>
                    {stop.attributes.municipality}
                  </div>
                )}
              </div>
              {/* Show a hint of what line(s) serve this stop would require extra fetch; skip for speed */}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── LandingPage — tabbed: Search (instant) | Browse (cascade) ────────────────
function LandingPage({ favorites, onCommit, onOpenFav, onRemoveFav, onNavigate }) {
  const [tab, setTab] = useState('search')  // 'search' | 'browse'

  return (
    <div className="anim-fade-in">
      {/* Wordmark */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(48px,10vw,76px)', letterSpacing: '-0.05em', color: 'var(--text)', lineHeight: 1, margin: 0 }}>
            DWELL
          </h1>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent)', marginBottom: 12, marginLeft: 7, flexShrink: 0, boxShadow: '0 0 20px var(--accent)' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.18em', marginBottom: 16 }}>
          GREATER BOSTON TRANSIT INTELLIGENCE
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 40, height: 2, background: 'var(--accent)', borderRadius: 1 }} />
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      </div>

      {/* Saved stops — always shown above the tab UI */}
      {favorites.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <FavoritesPanel favorites={favorites} onOpen={onOpenFav} onRemove={onRemoveFav} />
        </div>
      )}

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--bg-3)', borderRadius: 'var(--radius-md)',
        padding: 4,
      }}>
        {[['search', 'Search a stop'], ['browse', 'Browse by line']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '9px 16px',
              background: tab === id ? 'var(--bg)' : 'transparent',
              border: tab === id ? '1px solid var(--border-mid)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: tab === id ? 'var(--text)' : 'var(--text-dim)',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: tab === id ? 600 : 400,
              letterSpacing: '0.1em', cursor: 'pointer',
              transition: 'all 0.16s',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
            }}
          >
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Search tab — type stop name → tap → instant arrivals, no extra steps */}
      {tab === 'search' && (
        <div className="anim-fade-in" style={{ minHeight: 240 }}>
          <p style={{
            fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-muted)',
            lineHeight: 1.6, marginBottom: 20,
          }}>
            Type any stop name. Tap a result to go straight to live arrivals.
          </p>
          <QuickSearch onCommit={onCommit} autoFocus />
        </div>
      )}

      {/* Browse tab — full Mode → Route → Stop cascade */}
      {tab === 'browse' && (
        <div className="anim-fade-in">
          <SelectorPanel onCommit={onCommit} />
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 52, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
        {/* Donate — centrepiece of the footer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-muted)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            DWELL is free and independent. If it saves you time,
          </p>
          <DonateButton />
        </div>

        {/* Nav links row */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 0, paddingTop: 20, borderTop: '1px solid var(--border)',
        }}>
          {[['about','About'],['feedback','Feedback'],['privacy','Privacy']].map(([id, label], i) => (
            <React.Fragment key={id}>
              {i > 0 && <span style={{ width: 1, height: 12, background: 'var(--border-mid)', display: 'inline-block', margin: '0 16px' }} />}
              <button onClick={() => onNavigate(id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                color: 'var(--text-muted)', letterSpacing: '0.1em',
                padding: 0, transition: 'color 0.14s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</button>
            </React.Fragment>
          ))}
        </div>

        {/* Version */}
        <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
            DWELL v{VERSION} · Not affiliated with the MBTA
          </span>
        </div>
      </footer>
    </div>
  )
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
// "Pulse" replaced with "Plan" (Next Train Finder)
const NAV_ITEMS = [
  { id: 'landing', icon: '⌂', label: 'Home'  },
  { id: 'saved',   icon: '★', label: 'Saved' },
  { id: 'plan',    icon: '→', label: 'Plan'  },
  { id: 'about',   icon: '◉', label: 'About' },
]

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => window.innerWidth < 768)
  React.useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

function BottomNav({ page, onNavigate }) {
  const isMobile = useIsMobile()

  const isActive = (id) =>
    page === id ||
    (id === 'landing' && page === 'arrivals') ||
    (id === 'about'   && (page === 'feedback' || page === 'privacy'))

  // Mobile: fixed bottom tab bar
  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
        borderTop: '1px solid var(--border-mid)', display: 'flex',
      }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.id)
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                padding: '10px 4px 12px', background: 'transparent',
                border: 'none', cursor: 'pointer',
                borderTop: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                transition: 'all 0.14s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, color: active ? 'var(--accent)' : 'var(--nav-text)', transition: 'color 0.14s' }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', color: active ? 'var(--accent)' : 'var(--nav-text)', transition: 'color 0.14s' }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  // Desktop: horizontal link strip at the bottom of the viewport, minimal
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      borderTop: '1px solid var(--border-mid)',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, height: 40,
    }}>
      {NAV_ITEMS.map((item, i) => {
        const active = isActive(item.id)
        return (
          <React.Fragment key={item.id}>
            {i > 0 && <span style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0 }} />}
            <button onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '0 20px', height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
                color: active ? 'var(--accent)' : 'var(--nav-text)',
                transition: 'color 0.14s',
                borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--nav-text)' }}
            >
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              {item.label.toUpperCase()}
            </button>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// ── Donate ────────────────────────────────────────────────────────────────────
function DonateButton() {
  return (
    <a href={DONATE_URL} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 999,
        background: 'rgba(255,221,0,0.08)',
        border: '1.5px solid rgba(255,221,0,0.35)',
        color: '#D4A800', fontFamily: 'var(--mono)',
        fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
        textDecoration: 'none', transition: 'all 0.18s', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,221,0,0.15)'
        e.currentTarget.style.borderColor = 'rgba(255,221,0,0.7)'
        e.currentTarget.style.color = '#F0C800'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,221,0,0.08)'
        e.currentTarget.style.borderColor = 'rgba(255,221,0,0.35)'
        e.currentTarget.style.color = '#D4A800'
      }}
    >
      <span style={{ fontSize: 16 }}>☕</span>
      Buy me a coffee
    </a>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ onLogoClick, theme, onThemeToggle }) {
  const clock   = useClock()
  const isDark  = theme === 'dark'
  const isMobile = useIsMobile()
  return (
    <header style={{
      position: 'sticky', top: 2, zIndex: 100,
      background: isDark ? 'rgba(6,7,9,0.88)' : 'rgba(245,244,239,0.92)',
      backdropFilter: 'blur(22px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
      borderBottom: '1px solid var(--border)',
      padding: '0 clamp(14px, 4vw, 40px)', transition: 'background 0.25s',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, height: 50 }}>

        {/* Logo — always visible */}
        <button onClick={onLogoClick} style={{
          display: 'flex', alignItems: 'baseline', gap: 7, flexShrink: 0,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.14s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>DWELL</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--accent-dim)', padding: '2px 6px', border: '1px solid var(--accent-dim)', borderRadius: 2, lineHeight: 1 }}>MBTA</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Clock — desktop only */}
        {!isMobile && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', flexShrink: 0 }}>
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}

        {/* Theme toggle — icon-only on mobile, icon+label on desktop */}
        <button onClick={onThemeToggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            padding: isMobile ? '6px 8px' : '5px 10px',
            borderRadius: 'var(--radius-sm)',
            background: isDark ? 'rgba(242,202,69,0.12)' : 'var(--bg-3)',
            border: isDark ? '1px solid rgba(242,202,69,0.35)' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.16s',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
            color: isDark ? '#F2CA45' : 'var(--text-muted)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.background = 'rgba(242,202,69,0.18)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(242,202,69,0.35)' : 'var(--border)'
            e.currentTarget.style.background = isDark ? 'rgba(242,202,69,0.12)' : 'var(--bg-3)'
            e.currentTarget.style.color = isDark ? '#F2CA45' : 'var(--text-muted)'
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>{isDark ? '☀' : '◑'}</span>
          {!isMobile && <span>{isDark ? 'LIGHT' : 'DARK'}</span>}
        </button>

        {/* Live indicator — dot only on mobile, dot+text on desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <LiveDot color="#3FCF84" size={7} />
          {!isMobile && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.12em' }}>LIVE</span>
          )}
        </div>

      </div>
    </header>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // Read initial page from URL path so direct links work
  const [page, setPage] = useState(() => {
    const path = window.location.pathname
    return {
      '/':         'landing',
      '/saved':    'saved',
      '/plan':     'plan',
      '/about':    'about',
      '/feedback': 'feedback',
      '/privacy':  'privacy',
    }[path] || 'landing'
  })
  const [selection, setSelection] = useState(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const isDark = theme === 'dark'

  // URL ↔ page mapping for real addressable routes
  const PAGE_TO_PATH = {
    landing:  '/',
    arrivals: '/',    // arrivals is dynamic — stays at /
    saved:    '/saved',
    plan:     '/plan',
    about:    '/about',
    feedback: '/feedback',
    privacy:  '/privacy',
  }
  const PATH_TO_PAGE = {
    '/':         'landing',
    '/saved':    'saved',
    '/plan':     'plan',
    '/about':    'about',
    '/feedback': 'feedback',
    '/privacy':  'privacy',
  }

  const navigate = useCallback((id) => {
    setPage(id)
    const path = PAGE_TO_PATH[id] || '/'
    if (window.location.pathname !== path) {
      window.history.pushState({ page: id }, '', path)
    }
    // Keep canonical tag in sync with current URL for SEO
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.href = `https://dwellmbta.com${path}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  // Handle browser back/forward buttons
  useEffect(() => {
    const onPop = (e) => {
      const path = window.location.pathname
      const id = {
        '/':         'landing',
        '/saved':    'saved',
        '/plan':     'plan',
        '/about':    'about',
        '/feedback': 'feedback',
        '/privacy':  'privacy',
      }[path] || 'landing'
      setPage(id)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const handleCommit = useCallback((sel) => {
    setSelection(sel); navigate('arrivals')
  }, [navigate])
  const handleToggleFavorite = useCallback((entry) => {
    isFavorite(entry.stop?.id, entry.route?.id)
      ? removeFavorite(entry.stop.id, entry.route.id)
      : addFavorite(entry)
  }, [isFavorite, addFavorite, removeFavorite])

  const renderPage = () => {
    switch (page) {
      case 'arrivals':
        return (
          <ArrivalsBoard
            mode={selection?.mode} route={selection?.route} stop={selection?.stop}
            isFavorite={isFavorite} onToggleFavorite={handleToggleFavorite}
            onBack={() => navigate('landing')}
          />
        )

      case 'saved':
        return (
          <div className="anim-fade-in">
            <div style={{ paddingLeft: 18, marginBottom: 28, borderLeft: '3px solid var(--accent)' }}>
              <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(26px,6vw,40px)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1, margin: 0 }}>Saved Stops</h2>
            </div>
            {favorites.length === 0
              ? <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em', lineHeight: 1.8 }}>
                  No saved stops yet.<br />Star a stop on the arrivals board to save it here.
                </div>
              : <FavoritesPanel favorites={favorites} onOpen={fav => { setSelection(fav); navigate('arrivals') }} onRemove={removeFavorite} />
            }
            <div style={{ marginTop: 40, paddingTop: 18, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
              <DonateButton />
            </div>
          </div>
        )

      case 'plan':
        return (
          <div className="anim-fade-in">
            <div style={{ paddingLeft: 18, marginBottom: 20, borderLeft: '3px solid var(--accent)' }}>
              <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(26px,6vw,40px)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1, margin: 0 }}>Next Train</h2>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.7, letterSpacing: '0.04em' }}>
                Enter any two stops to see direct connections with live departure times and ride duration.
              </p>
            </div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />
            <NextTrain />
          </div>
        )

      case 'about':    return <AboutPage onNavigate={navigate} />
      case 'feedback': return <FeedbackPage onNavigate={navigate} />
      case 'privacy':  return <PrivacyPage onNavigate={navigate} />

      default: // landing
        return (
          <LandingPage
            favorites={favorites}
            onCommit={handleCommit}
            onOpenFav={fav => { setSelection(fav); navigate('arrivals') }}
            onRemoveFav={removeFavorite}
            onNavigate={navigate}
          />
        )
    }
  }

  return (
    <>
      <Scanlines />
      {isDark && (
        <div style={{
          position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: '50vw', height: 200,
          background: 'radial-gradient(ellipse, rgba(232,197,71,0.055) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}
      {/* Top accent stripe */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 999,
        background: 'linear-gradient(90deg, var(--accent) 0%, rgba(59,130,246,0.7) 50%, rgba(168,85,247,0.5) 100%)',
      }} />
      <Header onLogoClick={() => navigate('landing')} theme={theme} onThemeToggle={toggleTheme} />
      <main style={{
        position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto',
        padding: 'clamp(24px,4vw,44px) clamp(16px,4vw,40px) 100px',
      }}>
        {renderPage()}
      </main>
      <BottomNav page={page} onNavigate={navigate} />
    </>
  )
}
