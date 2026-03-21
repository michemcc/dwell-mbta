import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useClock, useFavorites, useStopSearch, useTheme } from './hooks/index'
import { getLineColor, mbtaFetch } from './utils/mbta'
import SelectorPanel from './components/SelectorPanel'
import FavoritesPanel from './components/FavoritesPanel'
import ArrivalsBoard from './components/ArrivalsBoard'
import NextTrain from './components/NextTrain'
import { AboutPage, FeedbackPage, PrivacyPage } from './components/StaticPages'
import { Scanlines, LiveDot, MonoLabel, Spinner, Pill } from './components/Primitives'

const VERSION = '2026.3.0'
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
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(40px,9vw,68px)', letterSpacing: '-0.05em', color: 'var(--text)', lineHeight: 1, margin: 0 }}>
            DWELL
          </h1>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', marginBottom: 10, marginLeft: 6, flexShrink: 0, boxShadow: '0 0 16px var(--accent)' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
          GREATER BOSTON TRANSIT INTELLIGENCE
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 32, height: 1, background: 'var(--accent)' }} />
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      </div>

      {/* Saved stops — always shown above the tab UI */}
      {favorites.length > 0 && (
        <div style={{ marginBottom: 28 }}>
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
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-muted)',
            lineHeight: 1.65, marginBottom: 16,
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
      <div style={{
        marginTop: 44, paddingTop: 18, borderTop: '1px solid var(--border)',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[['about','About'],['feedback','Feedback'],['privacy','Privacy']].map(([id, label]) => (
          <button key={id} onClick={() => onNavigate(id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)',
            letterSpacing: '0.1em', padding: 0, transition: 'color 0.14s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
          >{label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <DonateButton compact />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>v{VERSION}</span>
        </div>
      </div>
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

function BottomNav({ page, onNavigate }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      background: 'rgba(6,7,9,0.90)',
      backdropFilter: 'blur(24px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
      borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex',
    }}>
      {NAV_ITEMS.map(item => {
        const active =
          page === item.id ||
          (item.id === 'landing' && page === 'arrivals') ||
          (item.id === 'about'   && (page === 'feedback' || page === 'privacy'))
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
            <span style={{ fontSize: 18, lineHeight: 1, color: active ? 'var(--accent)' : 'var(--text-dim)', transition: 'color 0.14s' }}>{item.icon}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', color: active ? 'var(--accent)' : 'var(--text-dim)', transition: 'color 0.14s' }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Donate ────────────────────────────────────────────────────────────────────
function DonateButton({ compact }) {
  return (
    <a href={DONATE_URL} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: compact ? 6 : 8,
        padding: compact ? '5px 12px' : '8px 16px', borderRadius: 999,
        background: 'transparent', border: '1px solid var(--border)',
        color: 'var(--text-muted)', fontFamily: 'var(--mono)',
        fontSize: compact ? 10 : 11, letterSpacing: '0.1em',
        textDecoration: 'none', transition: 'all 0.14s', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#FFDD00'; e.currentTarget.style.color='#FFDD00'; e.currentTarget.style.background='rgba(255,221,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='transparent' }}
    >
      <span style={{ fontSize: compact ? 13 : 15 }}>☕</span>
      Buy me a coffee
    </a>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ onLogoClick, theme, onThemeToggle }) {
  const clock  = useClock()
  const isDark = theme === 'dark'
  return (
    <header style={{
      position: 'sticky', top: 2, zIndex: 100,
      background: isDark ? 'rgba(6,7,9,0.88)' : 'rgba(245,244,239,0.92)',
      backdropFilter: 'blur(22px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
      borderBottom: '1px solid var(--border)',
      padding: '0 clamp(16px, 4vw, 40px)', transition: 'background 0.25s',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 52 }}>
        <button onClick={onLogoClick} style={{
          display: 'flex', alignItems: 'baseline', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.14s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>DWELL</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--accent-dim)', padding: '2px 6px', border: '1px solid var(--accent-dim)', borderRadius: 2, lineHeight: 1 }}>MBTA</span>
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <button onClick={onThemeToggle} title={isDark ? 'Light mode' : 'Dark mode'}
          style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, transition: 'all 0.14s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >{isDark ? '☀' : '◑'}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <LiveDot color="#3DBA7F" size={7} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.12em' }}>LIVE</span>
        </div>
      </div>
    </header>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState('landing')
  const [selection, setSelection] = useState(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const isDark = theme === 'dark'

  const navigate = useCallback((id) => {
    setPage(id); window.scrollTo({ top: 0, behavior: 'smooth' })
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
      case 'feedback': return <FeedbackPage />
      case 'privacy':  return <PrivacyPage />

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
