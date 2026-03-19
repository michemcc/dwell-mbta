import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useClock, useFavorites } from './hooks/index'
import { useRoutes, useStops } from './hooks/index'
import { MODES, getLineColor } from './utils/mbta'
import SelectorPanel from './components/SelectorPanel'
import FavoritesPanel from './components/FavoritesPanel'
import ArrivalsBoard from './components/ArrivalsBoard'
import { AboutPage, FeedbackPage, PrivacyPage } from './components/StaticPages'
import { Scanlines, LiveDot, MonoLabel, Spinner, Pill } from './components/Primitives'

const VERSION = '2026.1.3'

// ── Quick Search ──────────────────────────────────────────────────────────────
// Floating search box on the landing page for direct stop lookup
function QuickSearch({ onCommit }) {
  const [query, setQuery] = useState('')
  const [mode, setMode]   = useState(MODES[0])
  const { routes, loading: rLoading } = useRoutes(mode)
  const [route, setRoute] = useState(null)
  const { stops, loading: sLoading }  = useStops(route)
  const [open, setOpen]   = useState(false)
  const ref               = useRef(null)

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Filter stops by query
  const filteredStops = stops.filter(s =>
    (s.attributes?.name || '').toLowerCase().includes(query.toLowerCase())
  )
  // Filter routes by query too when no route selected
  const filteredRoutes = routes.filter(r => {
    const q = query.toLowerCase()
    return (r.attributes?.long_name || '').toLowerCase().includes(q) ||
           (r.attributes?.short_name || '').toLowerCase().includes(q) ||
           r.id.toLowerCase().includes(q)
  })

  const handleStopSelect = (stop) => {
    if (!route) return
    onCommit({ mode, route, stop })
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 36 }}>
      {/* Label */}
      <MonoLabel style={{ display: 'block', marginBottom: 10 }}>Quick search</MonoLabel>

      {/* Mode pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m); setRoute(null); setQuery('') }}
            style={{
              padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
              background: mode?.id === m.id ? 'var(--accent)' : 'transparent',
              border: `1px solid ${mode?.id === m.id ? 'var(--accent)' : 'var(--border)'}`,
              color: mode?.id === m.id ? '#07080C' : 'var(--text-muted)',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
              transition: 'all 0.14s',
            }}>{m.label}</button>
        ))}
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 16, pointerEvents: 'none',
        }}>›</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={route ? `Search stops on ${route.attributes?.short_name || route.id}…` : `Search routes or stops…`}
          style={{
            width: '100%', background: 'var(--bg-3)',
            border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontFamily: 'var(--mono)', fontSize: 13, padding: '12px 40px 12px 32px',
            letterSpacing: '0.04em', outline: 'none',
          }}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); e.target.blur() }}}
        />
        {(query || route) && (
          <button onClick={() => { setQuery(''); setRoute(null); setOpen(false) }}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-4)', border: 'none', borderRadius: '50%',
              width: 22, height: 22, cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= 1 && (
        <div className="anim-fade-up" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', zIndex: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden',
          maxHeight: 320, overflowY: 'auto',
        }}>
          {/* If no route selected: show matching routes */}
          {!route && (
            <>
              {rLoading && (
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spinner size={12} /><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Loading routes…</span>
                </div>
              )}
              {filteredRoutes.slice(0, 8).map(r => {
                const lc = getLineColor(r.id)
                return (
                  <button key={r.id} onClick={() => { setRoute(r); setQuery('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '11px 16px', background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: lc.accent, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.attributes?.long_name || r.attributes?.short_name || r.id}
                    </span>
                    {r.attributes?.short_name && r.attributes.short_name !== r.attributes?.long_name && (
                      <Pill color={lc.accent} style={{ flexShrink: 0 }}>{r.attributes.short_name}</Pill>
                    )}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>→ pick stop</span>
                  </button>
                )
              })}
              {!rLoading && filteredRoutes.length === 0 && (
                <div style={{ padding: '20px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
                  No routes match
                </div>
              )}
            </>
          )}

          {/* Route selected: show matching stops */}
          {route && (
            <>
              {/* Route breadcrumb */}
              <div style={{
                padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-3)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: getLineColor(route.id).accent, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
                  {route.attributes?.long_name || route.id}
                </span>
                <button onClick={() => { setRoute(null); setQuery('') }}
                  style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← change route
                </button>
              </div>
              {sLoading && (
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spinner size={12} /><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Loading stops…</span>
                </div>
              )}
              {filteredStops.slice(0, 10).map(s => (
                <button key={s.id} onClick={() => handleStopSelect(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '11px 16px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>◆</span>
                  <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.attributes?.name || s.id}
                  </span>
                  {s.attributes?.municipality && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                      {s.attributes.municipality}
                    </span>
                  )}
                </button>
              ))}
              {!sLoading && filteredStops.length === 0 && (
                <div style={{ padding: '20px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
                  No stops match
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Bottom Nav (mobile) ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'landing',  icon: '⌂', label: 'Home'   },
  { id: 'saved',    icon: '★', label: 'Saved'  },
  { id: 'search',   icon: '⌕', label: 'Search' },
  { id: 'about',    icon: '◉', label: 'About'  },
]

function BottomNav({ page, onNavigate }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      background: 'rgba(7,8,12,0.97)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
    }}>
      {NAV_ITEMS.map(item => {
        const active = page === item.id ||
          (item.id === 'landing' && page === 'arrivals') ||
          (item.id === 'about' && (page === 'feedback' || page === 'privacy'))
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              padding: '10px 4px 12px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderTop: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.14s',
            }}
          >
            <span style={{
              fontSize: 18, lineHeight: 1,
              color: active ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'color 0.14s',
            }}>{item.icon}</span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
              color: active ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'color 0.14s',
            }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ onLogoClick }) {
  const clock = useClock()
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(7,8,12,0.93)', backdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 clamp(16px, 4vw, 40px)',
    }}>
      <div style={{
        maxWidth: 860, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 16, height: 52,
      }}>
        {/* Logo — clickable home */}
        <button onClick={onLogoClick} style={{
          display: 'flex', alignItems: 'baseline', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          transition: 'opacity 0.14s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{
            fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800,
            letterSpacing: '-0.04em', color: 'var(--text)',
          }}>DWELL</span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
            color: 'var(--accent-dim)', padding: '2px 6px',
            border: '1px solid var(--accent-dim)', borderRadius: 2, lineHeight: 1,
          }}>MBTA</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Clock — hidden on very small screens via inline approach */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
          letterSpacing: '0.1em', display: 'var(--clock-display, block)',
        }}>
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        {/* Version badge */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
          letterSpacing: '0.08em',
          display: 'none',
        }}
          ref={el => { if (el && window.innerWidth >= 600) el.style.display = 'block' }}
        >
          v{VERSION}
        </span>

        {/* Live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <LiveDot color="#3DBA7F" size={7} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.12em' }}>
            LIVE
          </span>
        </div>
      </div>
    </header>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
// pages: 'landing' | 'arrivals' | 'saved' | 'search' | 'about' | 'feedback' | 'privacy'
export default function App() {
  const [page, setPage]           = useState('landing')
  const [selection, setSelection] = useState(null)
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()

  const navigate = useCallback((id) => {
    setPage(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCommit = useCallback((sel) => {
    setSelection(sel)
    navigate('arrivals')
  }, [navigate])

  const handleToggleFavorite = useCallback((entry) => {
    if (isFavorite(entry.stop?.id, entry.route?.id)) {
      removeFavorite(entry.stop.id, entry.route.id)
    } else {
      addFavorite(entry)
    }
  }, [isFavorite, addFavorite, removeFavorite])

  const handleOpenFavorite = useCallback((fav) => {
    setSelection(fav)
    navigate('arrivals')
  }, [navigate])

  const renderPage = () => {
    switch (page) {
      case 'arrivals':
        return (
          <ArrivalsBoard
            mode={selection?.mode}
            route={selection?.route}
            stop={selection?.stop}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onBack={() => navigate('landing')}
          />
        )
      case 'saved':
        return (
          <div className="anim-fade-in">
            <div style={{ paddingLeft: 18, marginBottom: 28, borderLeft: '3px solid var(--accent)' }}>
              <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(26px,6vw,40px)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1, margin: 0 }}>
                Saved Stops
              </h2>
            </div>
            {favorites.length === 0
              ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                  No saved stops yet — star a stop on the arrivals board to save it here.
                </div>
              )
              : (
                <FavoritesPanel
                  favorites={favorites}
                  onOpen={handleOpenFavorite}
                  onRemove={removeFavorite}
                />
              )
            }
          </div>
        )
      case 'search':
        return (
          <div className="anim-fade-in">
            <div style={{ paddingLeft: 18, marginBottom: 28, borderLeft: '3px solid var(--accent)' }}>
              <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(26px,6vw,40px)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1, margin: 0 }}>
                Find a Stop
              </h2>
            </div>
            <QuickSearch onCommit={handleCommit} />
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />
            <SelectorPanel onCommit={handleCommit} />
          </div>
        )
      case 'about':    return <AboutPage />
      case 'feedback': return <FeedbackPage />
      case 'privacy':  return <PrivacyPage />

      default: // 'landing'
        return (
          <div className="anim-fade-in">
            {/* Wordmark */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginBottom: 5 }}>
                <h1 style={{
                  fontFamily: 'var(--display)', fontWeight: 800,
                  fontSize: 'clamp(40px, 9vw, 68px)', letterSpacing: '-0.05em',
                  color: 'var(--text)', lineHeight: 1, margin: 0,
                }}>DWELL</h1>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--accent)', marginBottom: 10, marginLeft: 6,
                  flexShrink: 0, boxShadow: '0 0 16px var(--accent)',
                }} />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
                GREATER BOSTON TRANSIT INTELLIGENCE
              </div>
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 32, height: 1, background: 'var(--accent)' }} />
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </div>

            {/* Quick search */}
            <QuickSearch onCommit={handleCommit} />

            {/* Favorites */}
            {favorites.length > 0 && (
              <>
                <FavoritesPanel
                  favorites={favorites}
                  onOpen={handleOpenFavorite}
                  onRemove={removeFavorite}
                />
                <div style={{ height: 1, background: 'var(--border)', margin: '32px 0' }} />
              </>
            )}

            {/* Full selector */}
            <MonoLabel style={{ display: 'block', marginBottom: 20 }}>Browse by line</MonoLabel>
            <SelectorPanel onCommit={handleCommit} />

            {/* Footer links */}
            <div style={{
              marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--border)',
              display: 'flex', gap: 20, flexWrap: 'wrap',
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em',
            }}>
              {[['about','About'], ['feedback','Feedback'], ['privacy','Privacy']].map(([id, label]) => (
                <button key={id} onClick={() => navigate(id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)',
                  letterSpacing: '0.1em', padding: 0, transition: 'color 0.14s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                >{label}</button>
              ))}
              <span style={{ marginLeft: 'auto' }}>v{VERSION}</span>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <Scanlines />
      <div style={{
        position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '50vw', height: 200,
        background: 'radial-gradient(ellipse, rgba(232,197,71,0.055) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Header onLogoClick={() => navigate('landing')} />

      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 860, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 44px) clamp(16px, 4vw, 40px) 100px',
      }}>
        {renderPage()}
      </main>

      <BottomNav page={page} onNavigate={navigate} />
    </>
  )
}
