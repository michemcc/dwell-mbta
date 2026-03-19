import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatCountdown, COUNTDOWN_COLORS, getLineColor, mbtaFetch } from '../utils/mbta'
import { usePredictions, useClock, useStops } from '../hooks/index'
import { Spinner, LiveDot, MonoLabel, Divider, ErrorBox, SkeletonRow, Pill } from './Primitives'

// ─────────────────────────────────────────────────────────────────────────────
// StopMap — OSM tiles, correctly centered on the stop's pixel position
// ─────────────────────────────────────────────────────────────────────────────
function StopMap({ stop, accent }) {
  const containerRef = useRef(null)
  const [containerW, setContainerW] = useState(0)
  const CONTAINER_H = 200
  const TILE_SZ = 256
  const ZOOM = 15

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const lat = stop?.attributes?.latitude
  const lng = stop?.attributes?.longitude
  if (!lat || !lng) return null

  // tile indices for the stop
  const n = Math.pow(2, ZOOM)
  const xTileF = (lng + 180) / 360 * n
  const latRad  = lat * Math.PI / 180
  const yTileF  = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
  const xTile   = Math.floor(xTileF)
  const yTile   = Math.floor(yTileF)

  // pixel of stop inside the 3×3 tile grid (each tile = 256px)
  // top-left of center tile is (TILE_SZ, TILE_SZ)
  const stopPxX = TILE_SZ + (xTileF - xTile) * TILE_SZ
  const stopPxY = TILE_SZ + (yTileF - yTile) * TILE_SZ

  // offset so the stop pixel sits at the centre of the container
  const offsetX = containerW / 2 - stopPxX
  const offsetY = CONTAINER_H / 2 - stopPxY

  const tiles = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = xTile + dx
      const ty = yTile + dy
      const s  = ['a','b','c'][(tx + ty) % 3]
      tiles.push({ key: `${tx}-${ty}`, url: `https://${s}.tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`, dx, dy })
    }
  }

  return (
    <div ref={containerRef} style={{
      position: 'relative', width: '100%', height: CONTAINER_H,
      overflow: 'hidden', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)', background: '#0e1018',
    }}>
      {/* Tile grid */}
      {containerW > 0 && (
        <div style={{
          position: 'absolute',
          left: offsetX, top: offsetY,
          width: TILE_SZ * 3, height: TILE_SZ * 3,
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${TILE_SZ}px)`,
          gridTemplateRows:    `repeat(3, ${TILE_SZ}px)`,
          filter: 'brightness(0.42) saturate(0.5)',
        }}>
          {tiles.map(t => (
            <img key={t.key} src={t.url}
              width={TILE_SZ} height={TILE_SZ}
              style={{ display: 'block', gridColumn: t.dx + 2, gridRow: t.dy + 2 }}
              crossOrigin="anonymous" alt="" loading="eager"
            />
          ))}
        </div>
      )}

      {/* Radial vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(7,8,12,0.75) 100%)',
      }} />

      {/* Stop pin — centered in container */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        pointerEvents: 'none',
      }}>
        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          width: 36, height: 36, borderRadius: '50%',
          border: `2px solid ${accent}`,
          animation: 'pulse-dot 2s ease-out infinite',
          top: '50%', left: '50%',
          transform: 'translate(-50%, calc(-50% - 9px))',
        }} />
        {/* Dot */}
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: accent, border: '2.5px solid #07080C',
          boxShadow: `0 0 18px ${accent}99, 0 2px 8px rgba(0,0,0,0.9)`,
          zIndex: 2,
        }} />
        {/* Name tag */}
        <div style={{
          padding: '3px 10px',
          background: 'rgba(7,8,12,0.92)',
          border: `1px solid ${accent}55`,
          borderRadius: 4,
          fontFamily: 'var(--mono)', fontSize: 10,
          color: 'var(--text)', letterSpacing: '0.06em',
          whiteSpace: 'nowrap', zIndex: 2,
          boxShadow: '0 2px 10px rgba(0,0,0,0.7)',
        }}>
          {stop.attributes?.name}
        </div>
      </div>

      {/* OSM attribution */}
      <div style={{
        position: 'absolute', bottom: 4, right: 6,
        fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(255,255,255,0.28)',
        pointerEvents: 'none', zIndex: 3,
      }}>© OpenStreetMap</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LineChips — all routes serving this stop, selectable
// ─────────────────────────────────────────────────────────────────────────────
function useRoutesForStop(stopId) {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!stopId) return
    let cancelled = false
    setLoading(true)
    mbtaFetch(`/routes?filter[stop]=${stopId}&sort=sort_order`)
      .then(d => { if (!cancelled) setRoutes(d.data || []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [stopId])
  return { routes, loading }
}

function LineChips({ stopId, activeRouteId, onSelect }) {
  const { routes, loading } = useRoutesForStop(stopId)
  if (loading) return <Spinner size={12} />
  if (routes.length <= 1) return null

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      <MonoLabel style={{ marginRight: 2 }}>Also on this stop</MonoLabel>
      {routes.map(r => {
        const lc = getLineColor(r.id)
        const isActive = activeRouteId === r.id
        const label = r.attributes?.short_name || r.id
        return (
          <button key={r.id} onClick={() => onSelect(r)} title={r.attributes?.long_name || r.id}
            style={{
              padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
              background: isActive ? lc.accent : 'transparent',
              border: `1.5px solid ${isActive ? lc.accent : lc.accent + '66'}`,
              color: isActive ? '#07080C' : lc.accent,
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              transition: 'all 0.14s',
              boxShadow: isActive ? `0 0 10px ${lc.accent}44` : 'none',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = lc.accent + '22' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >{label}</button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StopDropdown — switch stops on same route inline
// ─────────────────────────────────────────────────────────────────────────────
function StopDropdown({ route, currentStop, onSelect }) {
  const { stops, loading } = useStops(route)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef  = useRef(null)
  const inputRef = useRef(null)
  const lc = getLineColor(route?.id)

  useEffect(() => {
    if (!open) return
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
    else setQuery('')
  }, [open])

  const filtered = stops.filter(s =>
    (s.attributes?.name || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 10px 4px 4px', borderRadius: 'var(--radius-sm)',
        background: open ? 'var(--bg-4)' : 'transparent',
        border: `1px solid ${open ? lc.accent : 'transparent'}`,
        color: 'var(--text)', fontFamily: 'var(--display)',
        fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 800,
        letterSpacing: '-0.03em', cursor: 'pointer',
        transition: 'all 0.14s', lineHeight: 1,
        maxWidth: '100%',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentStop?.attributes?.name || '—'}
        </span>
        <span style={{
          fontSize: 14, color: lc.accent, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s',
        }}>▾</span>
      </button>

      {open && (
        <div className="anim-fade-up" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 'max(100%, 300px)', maxWidth: 'min(400px, 92vw)',
          background: 'var(--bg-2)', border: `1px solid ${lc.accent}44`,
          borderRadius: 'var(--radius-md)', zIndex: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: lc.accent, fontFamily: 'var(--mono)', fontSize: 13, pointerEvents: 'none' }}>›</span>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search stops…"
                style={{
                  width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                  fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 10px 8px 26px', outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {loading
              ? [1,2,3].map(i => <SkeletonRow key={i} cols={[2, 0.6]} />)
              : filtered.map(s => {
                const isCur = s.id === currentStop?.id
                return (
                  <button key={s.id} onClick={() => { onSelect(s); setOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', background: isCur ? `${lc.accent}14` : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      borderLeft: `3px solid ${isCur ? lc.accent : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = 'var(--bg-3)' }}
                    onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 9, color: isCur ? lc.accent : 'var(--text-dim)' }}>◆</span>
                    <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', color: isCur ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.attributes?.name || s.id}
                    </span>
                    {s.attributes?.municipality && (
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', letterSpacing: '0.04em', flexShrink: 0 }}>
                        {s.attributes.municipality}
                      </span>
                    )}
                    {isCur && <span style={{ color: lc.accent, fontSize: 11, flexShrink: 0 }}>●</span>}
                  </button>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert Banner
// ─────────────────────────────────────────────────────────────────────────────
function AlertBanner({ alerts }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (alerts.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % alerts.length), 5000)
    return () => clearInterval(t)
  }, [alerts.length])
  if (!alerts.length) return null
  const a = alerts[idx]
  return (
    <div className="anim-fade-up" style={{
      display: 'flex', gap: 12, padding: '11px 16px', marginBottom: 20,
      background: 'rgba(232,80,74,0.07)', border: '1px solid rgba(232,80,74,0.25)',
      borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 13, flexShrink: 0 }}>⚠</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.03em', lineHeight: 1.5, flex: 1 }}>
        {a.attributes?.header || 'Service alert'}
      </span>
      {alerts.length > 1 && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0, alignSelf: 'center' }}>
          {idx + 1}/{alerts.length}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ArrivalRow — destination + minutes only
// ─────────────────────────────────────────────────────────────────────────────
function MinutesDisplay({ isoTime }) {
  const [label, setLabel] = useState('')
  const [tier, setTier]   = useState('ok')

  useEffect(() => {
    const compute = () => {
      const cd = formatCountdown(isoTime)
      setLabel(cd.label)
      setTier(cd.tier)
    }
    compute()
    const t = setInterval(compute, 1000)
    return () => clearInterval(t)
  }, [isoTime])

  const color = COUNTDOWN_COLORS[tier] || 'var(--text-muted)'
  const urgent = tier === 'boarding' || tier === 'now'
  const soon   = tier === 'soon'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      minWidth: 56, gap: 2,
    }}>
      <span style={{
        fontFamily: 'var(--mono)', fontWeight: 700,
        fontSize: urgent ? 18 : soon ? 16 : 15,
        color,
        letterSpacing: '0.02em',
        textShadow: urgent ? `0 0 16px ${color}77` : 'none',
        transition: 'color 0.4s, font-size 0.2s',
        lineHeight: 1,
      }}>
        {label}
      </span>
      {urgent && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.16em',
          color, opacity: 0.7, animation: 'blink 0.9s step-end infinite',
        }}>●●●</span>
      )}
    </div>
  )
}

function ArrivalRow({ pred, accent, index }) {
  const arrTime  = pred.attributes?.arrival_time || pred.attributes?.departure_time
  const headsign = pred.attributes?.headsign || '—'
  const status   = pred.attributes?.status
  const cd       = formatCountdown(arrTime)
  const urgent   = cd.tier === 'boarding' || cd.tier === 'now'

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${index * 0.035}s`,
        display: 'flex', alignItems: 'center',
        padding: '15px 20px', gap: 16,
        borderBottom: '1px solid var(--border)',
        background: index % 2 !== 0 ? 'rgba(255,255,255,0.013)' : 'transparent',
        position: 'relative', transition: 'background 0.14s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
      onMouseLeave={e => e.currentTarget.style.background = index % 2 !== 0 ? 'rgba(255,255,255,0.013)' : 'transparent'}
    >
      {/* Urgency bar */}
      {urgent && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: COUNTDOWN_COLORS[cd.tier],
          boxShadow: `0 0 8px ${COUNTDOWN_COLORS[cd.tier]}`,
        }} />
      )}

      {/* Line color dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: accent,
        boxShadow: `0 0 6px ${accent}88`,
      }} />

      {/* Destination */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontFamily: 'var(--sans)', fontWeight: 500,
          color: cd.tier === 'gone' ? 'var(--text-dim)' : 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {headsign}
        </div>
        {status && (
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', marginTop: 3, letterSpacing: '0.06em' }}>
            {status.toUpperCase()}
          </div>
        )}
      </div>

      {/* Minutes */}
      <MinutesDisplay isoTime={arrTime} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ArrivalsBoard — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ArrivalsBoard({ mode, route: initialRoute, stop: initialStop, isFavorite, onToggleFavorite, onBack }) {
  const [route, setRoute] = useState(initialRoute)
  const [stop, setStop]   = useState(initialStop)

  const handleRouteChipSelect = useCallback(async (newRoute) => {
    setRoute(newRoute)
    try {
      const d = await mbtaFetch(`/stops?filter[route]=${newRoute.id}&sort=name`)
      const stops = d.data || []
      const match = stops.find(s => s.attributes?.name === stop?.attributes?.name)
      setStop(match || stops[0] || null)
    } catch { setStop(null) }
  }, [stop?.attributes?.name])

  const { predictions, alerts, loading, error, lastFetch, refresh } = usePredictions(stop?.id, route?.id)
  const clock = useClock()
  const lc    = getLineColor(route?.id)
  const faved = isFavorite(stop?.id, route?.id)

  return (
    <div className="anim-fade-in">

      {/* ── Nav bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em',
          color: 'var(--text-dim)', background: 'transparent', border: 'none',
          cursor: 'pointer', padding: 0, transition: 'color 0.14s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
        >← BACK</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Favorite */}
          <button onClick={() => onToggleFavorite({ mode, route, stop })}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              background: faved ? 'rgba(232,197,71,0.12)' : 'transparent',
              border: `1px solid ${faved ? 'var(--accent)' : 'var(--border)'}`,
              color: faved ? 'var(--accent)' : 'var(--text-dim)',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
              cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!faved) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}}
            onMouseLeave={e => { if (!faved) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}}
          >
            <span style={{ fontSize: 14 }}>{faved ? '★' : '☆'}</span>
            <span style={{ display: window.innerWidth < 480 ? 'none' : 'inline' }}>{faved ? 'SAVED' : 'SAVE'}</span>
          </button>
          {/* Refresh */}
          <button onClick={refresh} disabled={loading}
            style={{
              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 12,
              cursor: loading ? 'default' : 'pointer', transition: 'all 0.14s', opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {loading ? <Spinner size={12} /> : '⟳'}
          </button>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ marginBottom: 22 }}>
        <StopMap stop={stop} accent={lc.accent} />
      </div>

      {/* ── Station header ── */}
      <div style={{ paddingLeft: 18, marginBottom: 16, borderLeft: `3px solid ${lc.accent}` }}>
        <MonoLabel style={{ display: 'block', marginBottom: 6 }}>
          {mode?.label}
          {route?.attributes?.short_name ? ` · ${route.attributes.short_name}` : route?.id ? ` · ${route.id}` : ''}
        </MonoLabel>
        {/* Stop name dropdown */}
        <StopDropdown route={route} currentStop={stop} onSelect={setStop} />
        {stop?.attributes?.municipality && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.08em' }}>
            {stop.attributes.municipality}
            {stop.attributes?.platform_name ? ` · ${stop.attributes.platform_name}` : ''}
          </div>
        )}
      </div>

      {/* ── Multi-line chips ── */}
      <LineChips stopId={stop?.id} activeRouteId={route?.id} onSelect={handleRouteChipSelect} />

      {/* ── Alerts ── */}
      <AlertBanner alerts={alerts} />
      <ErrorBox message={error} style={{ marginBottom: 16 }} />

      {/* ── Table header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '7px 20px', marginBottom: 0,
        borderBottom: `1.5px solid ${lc.accent}55`,
      }}>
        <MonoLabel>Destination</MonoLabel>
        <MonoLabel>Min</MonoLabel>
      </div>

      {/* ── Prediction rows ── */}
      {loading && !predictions.length
        ? [1,2,3,4,5].map(i => <SkeletonRow key={i} cols={[2.5, 0.4]} />)
        : predictions.length === 0
        ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
            No upcoming arrivals found
          </div>
        )
        : (
          <div style={{
            border: '1px solid var(--border)', borderTop: 'none',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)', overflow: 'hidden',
          }}>
            {predictions.map((p, i) => (
              <ArrivalRow key={p.id} pred={p} accent={lc.accent} index={i} />
            ))}
          </div>
        )
      }

      {/* ── Status bar ── */}
      <Divider style={{ marginTop: 20, marginBottom: 10 }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LiveDot color={loading ? '#E8C547' : '#3DBA7F'} />
          <span style={{ color: loading ? 'var(--accent)' : 'var(--green)' }}>
            {loading ? 'REFRESHING' : 'LIVE'}
          </span>
          {lastFetch && <span>· {lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
        </div>
        <span>{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · ↻ 20s</span>
      </div>
    </div>
  )
}
