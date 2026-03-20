import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatCountdown, COUNTDOWN_COLORS, getLineColor, mbtaFetch } from '../utils/mbta'
import { usePredictions, useClock, useStops, useRoutesForStop, useVehicles } from '../hooks/index'
import { Spinner, LiveDot, MonoLabel, Divider, ErrorBox, SkeletonRow, Pill } from './Primitives'

// ─────────────────────────────────────────────────────────────────────────────
// CR Train Map Modal — shows live vehicles for a Commuter Rail route on a map
// ─────────────────────────────────────────────────────────────────────────────
function CRTrainModal({ route, onClose }) {
  const { vehicles, loading, refresh } = useVehicles(route?.id, 15000)
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const TILE = 256
  const ZOOM = 9  // wider zoom for commuter rail

  // Boston/eastern MA bounding box at zoom 9
  const CENTER = { lat: 42.36, lng: -71.06 }

  // Convert lat/lng to tile pixel position within 3×3 tile grid
  const n     = Math.pow(2, ZOOM)
  const cxF   = (CENTER.lng + 180) / 360 * n
  const cyLatR = CENTER.lat * Math.PI / 180
  const cyF   = (1 - Math.log(Math.tan(cyLatR) + 1 / Math.cos(cyLatR)) / Math.PI) / 2 * n
  const cx    = Math.floor(cxF)
  const cy    = Math.floor(cyF)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => setDims({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const lngToX = (lng) => {
    const xF = (lng + 180) / 360 * n
    return (xF - cx + 1) * TILE
  }
  const latToY = (lat) => {
    const latR = lat * Math.PI / 180
    const yF   = (1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n
    return (yF - cy + 1) * TILE
  }

  const tiles = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const tx = cx + dx, ty = cy + dy
      const s  = ['a','b','c'][(Math.abs(tx + ty)) % 3]
      tiles.push({ key: `${tx}-${ty}`, url: `https://${s}.tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`, dx, dy })
    }

  const lc = getLineColor(route?.id)
  const activeVehicles = vehicles.filter(v => {
    const lat = v.attributes?.latitude, lng = v.attributes?.longitude
    return lat && lng
  })

  const MODAL_H = Math.min(520, window.innerHeight * 0.8)

  // Close on backdrop click
  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose() }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(7,8,12,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 860,
          background: 'var(--bg-2)', borderRadius: '16px 16px 0 0',
          border: '1px solid var(--border)', borderBottom: 'none',
          overflow: 'hidden',
          animation: 'fadeUp 0.22s ease both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-3)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: lc.accent, boxShadow: `0 0 8px ${lc.accent}` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {route?.attributes?.long_name || route?.id}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', marginTop: 2 }}>
              LIVE TRAINS · UPDATES EVERY 15s
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {loading ? <Spinner size={12} /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <LiveDot color="#3DBA7F" size={6} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', letterSpacing: '0.1em' }}>
                  {activeVehicles.length} TRAINS
                </span>
              </div>
            )}
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--bg-4)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)',
            }}>✕</button>
          </div>
        </div>

        {/* Map */}
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: MODAL_H, background: 'var(--bg-3)', overflow: 'hidden' }}>
          {/* Tile grid */}
          <div style={{
            position: 'absolute',
            left: dims.w / 2 - lngToX(CENTER.lng),
            top:  MODAL_H / 2 - latToY(CENTER.lat),
            width: TILE * 3, height: TILE * 3,
            display: 'grid',
            gridTemplateColumns: `repeat(3,${TILE}px)`,
            gridTemplateRows:    `repeat(3,${TILE}px)`,
            filter: 'brightness(0.4) saturate(0.45)',
          }}>
            {tiles.map(t => (
              <img key={t.key} src={t.url} width={TILE} height={TILE}
                style={{ display: 'block', gridColumn: t.dx + 2, gridRow: t.dy + 2 }}
                crossOrigin="anonymous" alt="" loading="eager" />
            ))}
          </div>

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(7,8,12,0.65) 100%)',
          }} />

          {/* Vehicle markers */}
          {dims.w > 0 && activeVehicles.map(v => {
            const lat = v.attributes?.latitude
            const lng = v.attributes?.longitude
            if (!lat || !lng) return null

            const mapX = dims.w / 2 + lngToX(lng) - lngToX(CENTER.lng)
            const mapY = MODAL_H / 2 + latToY(lat) - latToY(CENTER.lat)

            if (mapX < -20 || mapX > dims.w + 20 || mapY < -20 || mapY > MODAL_H + 20) return null

            const status    = v.attributes?.current_status || ''
            const bearing   = v.attributes?.bearing
            const label     = v.attributes?.label || v.id.slice(-3)
            const isMoving  = status === 'IN_TRANSIT_TO'
            const isBoarding = status === 'STOPPED_AT'

            return (
              <div
                key={v.id}
                style={{
                  position: 'absolute',
                  left: mapX, top: mapY,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isMoving ? 20 : 10,
                  cursor: 'default',
                  transition: 'left 1s ease, top 1s ease',
                }}
                title={`Train ${label} · ${status.replace(/_/g, ' ')}`}
              >
                {/* Pulse for boarding trains */}
                {isBoarding && (
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    border: `1.5px solid ${lc.accent}`,
                    animation: 'pulse-dot 2s ease-out infinite',
                  }} />
                )}
                {/* Train icon */}
                <div style={{
                  width: isMoving ? 28 : 24,
                  height: isMoving ? 28 : 24,
                  borderRadius: '50%',
                  background: isBoarding ? lc.accent : 'var(--bg-4)',
                  border: `2px solid ${lc.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 ${isMoving ? 12 : 6}px ${lc.accent}66`,
                  transform: bearing != null ? `rotate(${bearing}deg)` : undefined,
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: 12, transform: bearing != null ? `rotate(-${bearing}deg)` : undefined }}>🚆</span>
                </div>
                {/* Label */}
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginTop: 3, padding: '1px 5px',
                  background: 'rgba(7,8,12,0.88)',
                  border: `1px solid ${lc.accent}44`,
                  borderRadius: 3,
                  fontFamily: 'var(--mono)', fontSize: 9, color: lc.accent,
                  letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>{label}</div>
              </div>
            )
          })}

          {/* OSM attribution */}
          <div style={{
            position: 'absolute', bottom: 6, right: 8,
            fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)',
            pointerEvents: 'none', zIndex: 5,
          }}>© OpenStreetMap</div>

          {/* Empty state */}
          {!loading && activeVehicles.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em',
            }}>
              No active trains on this route
            </div>
          )}
        </div>

        {/* Train list below map */}
        {activeVehicles.length > 0 && (
          <div style={{ maxHeight: 160, overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
            {activeVehicles.map(v => {
              const status = v.attributes?.current_status?.replace(/_/g, ' ') || '—'
              const label  = v.attributes?.label || v.id.slice(-4)
              const speed  = v.attributes?.speed
              return (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: lc.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', minWidth: 40 }}>Train {label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em', flex: 1, textTransform: 'capitalize' }}>
                    {status.toLowerCase()}
                  </span>
                  {speed != null && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
                      {Math.round(speed)} km/h
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StopMap — for non-CR routes (tile map centered on stop)
// ─────────────────────────────────────────────────────────────────────────────
function StopMap({ stop, accent, isCR, onOpenCRModal }) {
  const containerRef = useRef(null)
  const [containerW, setContainerW] = useState(0)
  const CONTAINER_H = 180
  const TILE_SZ = 256
  const ZOOM = 15

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => setContainerW(Math.round(e.contentRect.width)))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const lat = stop?.attributes?.latitude
  const lng = stop?.attributes?.longitude
  if (!lat || !lng) return null

  const n      = Math.pow(2, ZOOM)
  const xTileF = (lng + 180) / 360 * n
  const latRad = lat * Math.PI / 180
  const yTileF = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
  const xTile  = Math.floor(xTileF)
  const yTile  = Math.floor(yTileF)
  const stopPxX = TILE_SZ + (xTileF - xTile) * TILE_SZ
  const stopPxY = TILE_SZ + (yTileF - yTile) * TILE_SZ
  const offsetX = containerW / 2 - stopPxX
  const offsetY = CONTAINER_H / 2 - stopPxY

  const tiles = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const tx = xTile + dx, ty = yTile + dy
      const s  = ['a','b','c'][(tx + ty) % 3]
      tiles.push({ key: `${tx}-${ty}`, url: `https://${s}.tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`, dx, dy })
    }

  return (
    <div ref={containerRef} style={{
      position: 'relative', width: '100%', height: CONTAINER_H,
      overflow: 'hidden', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)', background: 'var(--bg-3)',
      cursor: isCR ? 'pointer' : 'default',
    }}
      onClick={isCR ? onOpenCRModal : undefined}
    >
      {containerW > 0 && (
        <div style={{
          position: 'absolute', left: offsetX, top: offsetY,
          width: TILE_SZ * 3, height: TILE_SZ * 3,
          display: 'grid',
          gridTemplateColumns: `repeat(3,${TILE_SZ}px)`,
          gridTemplateRows:    `repeat(3,${TILE_SZ}px)`,
          filter: 'brightness(0.42) saturate(0.5)',
        }}>
          {tiles.map(t => (
            <img key={t.key} src={t.url} width={TILE_SZ} height={TILE_SZ}
              style={{ display: 'block', gridColumn: t.dx + 2, gridRow: t.dy + 2 }}
              crossOrigin="anonymous" alt="" loading="eager" />
          ))}
        </div>
      )}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(7,8,12,0.78) 100%)',
      }} />
      {/* Stop pin */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%,-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', width: 38, height: 38, borderRadius: '50%',
          border: `2px solid ${accent}`, animation: 'pulse-dot 2s ease-out infinite',
          top: '50%', left: '50%', transform: 'translate(-50%, calc(-50% - 10px))',
        }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: accent, border: '2.5px solid #07080C', boxShadow: `0 0 18px ${accent}99`, zIndex: 2 }} />
        <div style={{ padding: '3px 10px', background: 'rgba(7,8,12,0.92)', border: `1px solid ${accent}55`, borderRadius: 4, fontFamily: 'var(--mono)', fontSize: 10, color: '#DFE0E3', letterSpacing: '0.06em', whiteSpace: 'nowrap', zIndex: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
          {stop.attributes?.name}
        </div>
      </div>

      {/* CR overlay button */}
      {isCR && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(7,8,12,0.45)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 20px',
            background: 'rgba(7,8,12,0.88)',
            border: `1px solid ${accent}88`,
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--mono)', fontSize: 12, color: accent,
            letterSpacing: '0.1em',
          }}>
            <span style={{ fontSize: 18 }}>🚆</span>
            SHOW LIVE TRAINS
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 4, right: 6, fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(255,255,255,0.28)', pointerEvents: 'none', zIndex: 3 }}>
        © OpenStreetMap
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LineChips
// ─────────────────────────────────────────────────────────────────────────────
function LineChips({ stopId, activeRouteId, onSelect }) {
  const { routes, loading } = useRoutesForStop(stopId)
  if (loading) return <Spinner size={12} />
  if (routes.length <= 1) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      <MonoLabel style={{ marginRight: 2 }}>Lines at this stop</MonoLabel>
      {routes.map(r => {
        const lc       = getLineColor(r.id)
        const isActive = activeRouteId === r.id
        const label    = r.attributes?.short_name || r.id
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
// StopDropdown
// ─────────────────────────────────────────────────────────────────────────────
function StopDropdown({ route, currentStop, onSelect }) {
  const { stops, loading } = useStops(route)
  const [open, setOpen]    = useState(false)
  const [query, setQuery]  = useState('')
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

  const filtered = stops.filter(s => (s.attributes?.name || '').toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 10px 4px 4px', borderRadius: 'var(--radius-sm)',
        background: open ? 'var(--bg-4)' : 'transparent',
        border: `1px solid ${open ? lc.accent : 'transparent'}`,
        color: 'var(--text)', fontFamily: 'var(--display)',
        fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 800,
        letterSpacing: '-0.03em', cursor: 'pointer', transition: 'all 0.14s', lineHeight: 1, maxWidth: '100%',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentStop?.attributes?.name || '—'}</span>
        <span style={{ fontSize: 14, color: lc.accent, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>▾</span>
      </button>
      {open && (
        <div className="anim-fade-up" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 'max(100%, 300px)', maxWidth: 'min(400px, 92vw)',
          background: 'var(--bg-2)', border: `1px solid ${lc.accent}44`,
          borderRadius: 'var(--radius-md)', zIndex: 300,
          boxShadow: '0 8px 32px var(--shadow)', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: lc.accent, fontFamily: 'var(--mono)', fontSize: 13, pointerEvents: 'none' }}>›</span>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search stops…"
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 10px 8px 26px', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {loading ? [1,2,3].map(i => <SkeletonRow key={i} cols={[2,0.6]} />) :
              filtered.map(s => {
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
// AlertBanner
// ─────────────────────────────────────────────────────────────────────────────
function AlertBanner({ alerts }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    setIdx(0)   // reset index when alerts list changes (e.g. route switch)
  }, [alerts])
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
      background: 'rgba(232,80,74,0.09)', border: '1px solid rgba(232,80,74,0.28)',
      borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 13, flexShrink: 0 }}>⚠</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.03em', lineHeight: 1.5, flex: 1 }}>
        {a.attributes?.header || 'Service alert'}
      </span>
      {alerts.length > 1 && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0, alignSelf: 'center' }}>{idx+1}/{alerts.length}</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveCountdown
// ─────────────────────────────────────────────────────────────────────────────
function LiveCountdown({ isoTime, large }) {
  const [cd, setCd] = useState(() => formatCountdown(isoTime))
  useEffect(() => {
    const t = setInterval(() => setCd(formatCountdown(isoTime)), 1000)
    return () => clearInterval(t)
  }, [isoTime])
  const color  = COUNTDOWN_COLORS[cd.tier] || 'var(--text-muted)'
  const urgent = cd.tier === 'boarding' || cd.tier === 'now'
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontWeight: 700,
      fontSize: large ? (urgent ? 20 : 17) : (urgent ? 16 : 14),
      color, letterSpacing: '0.02em',
      textShadow: urgent ? `0 0 14px ${color}66` : 'none',
      transition: 'color 0.4s', whiteSpace: 'nowrap',
    }}>
      {cd.label}
      {urgent && <span style={{ marginLeft: 4, fontSize: 8, animation: 'blink 0.9s step-end infinite', opacity: 0.7 }}>●</span>}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BranchBadge + DestinationGroup
// ─────────────────────────────────────────────────────────────────────────────
function BranchBadge({ label, accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 7px',
      borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', background: accent + '22', border: `1px solid ${accent}66`,
      color: accent, flexShrink: 0, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function DestGroupChip({ label, accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', flexShrink: 0,
      padding: '2px 9px', borderRadius: 999,
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
      background: accent + '22', border: `1px solid ${accent}55`,
      color: accent, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function DestinationGroup({ group, accent, groupIndex }) {
  const { headsign, isBranched, branches, predictions } = group
  const next     = predictions[0]
  const nextTime = next?.attributes?.arrival_time || next?.attributes?.departure_time

  return (
    <div className="anim-fade-up" style={{ animationDelay: `${groupIndex * 0.06}s`, borderBottom: '1px solid var(--border)' }}>
      {/* ── Section header ─────────────────────────────────────────────
           Two-row layout: name on top, chips below.
           Chips are on their own row so flex truncation CANNOT clip them. */}
      <div style={{
        padding: '12px 20px 10px', background: 'var(--bg-3)',
        borderLeft: `3px solid ${accent}`,
      }}>
        {/* Row 1: dot + destination name + countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: accent, boxShadow: `0 0 7px ${accent}88` }} />
            <span style={{
              fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700,
              letterSpacing: '-0.01em', color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {headsign}
            </span>
          </div>
          <LiveCountdown isoTime={nextTime} large />
        </div>
        {/* Row 2: chips — own row, never truncated */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 18 }}>
          {isBranched && branches.length > 0
            ? branches.map(b => <BranchBadge key={b} label={b} accent={accent} />)
            : <DestGroupChip label={headsign} accent={accent} />
          }
        </div>
      </div>

      {/* ── Subsequent trains for this destination ─────────────────────── */}
      {predictions.slice(1).map(p => {
        const arrTime = p.attributes?.arrival_time || p.attributes?.departure_time
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 20px 9px 43px',
            borderTop: '1px solid var(--border)',
            background: 'transparent', transition: 'background 0.12s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Branch chip or time */}
            {isBranched && p._branch
              ? <BranchBadge label={p._branch} accent={accent} />
              : null
            }
            {/* Scheduled time */}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', flex: 1 }}>
              {arrTime ? new Date(arrTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
            <LiveCountdown isoTime={arrTime} />
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ArrivalsBoard — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ArrivalsBoard({ mode, route: initialRoute, stop: initialStop, isFavorite, onToggleFavorite, onBack }) {
  const [route, setRoute]         = useState(initialRoute)
  const [stop, setStop]           = useState(initialStop)
  const [crModalOpen, setCRModal] = useState(false)

  // FIX: resolve the new stop FIRST, then atomically update both route and stop
  // so usePredictions never gets mismatched IDs (avoids stale alert bleed-through)
  const handleRouteChipSelect = useCallback(async (newRoute) => {
    setCRModal(false)

    // Resolve the best stop for the new route:
    // 1. Find the stop on the new route whose name matches the current stop name.
    // 2. Then resolve to its parent station (place-*) so that usePredictions
    //    always fetches alerts at the station level, not a platform-level child.
    //    Without this, alerts filtered by a child stop ID often return empty even
    //    when real alerts exist for that station on the new route.
    let newStop = stop
    try {
      const d     = await mbtaFetch(`/stops?filter[route]=${newRoute.id}`)
      const stops = d.data || []
      const match = stops.find(s => s.attributes?.name === stop?.attributes?.name)
      const raw   = match || stops[0] || null

      if (raw) {
        // Always prefer the parent station record
        const parentId = raw.relationships?.parent_station?.data?.id
        if (parentId) {
          try {
            const pd = await mbtaFetch(`/stops/${parentId}`)
            newStop = pd.data || raw
          } catch { newStop = raw }
        } else {
          newStop = raw
        }
      } else {
        newStop = null
      }
    } catch { newStop = null }

    // Single batched state update — route and stop change in the same render,
    // so usePredictions sees a consistent (stopId, routeId) pair immediately.
    setRoute(newRoute)
    setStop(newStop)
  }, [stop])

  // isCR based ONLY on the active route type, never on the entry-mode.
  // This prevents the CR map modal from showing when a user switches to a
  // subway chip (e.g. Orange Line at Forest Hills) from a CR stop.
  const isCR = route?.attributes?.type === 2

  const { groups, alerts, loading, error, lastFetch, refresh } = usePredictions(stop?.id, route?.id, 20000, stop?.attributes?.name || '')
  const clock = useClock()
  const lc    = getLineColor(route?.id)
  const faved = isFavorite(stop?.id, route?.id)

  return (
    <div className="anim-fade-in">
      {crModalOpen && <CRTrainModal route={route} onClose={() => setCRModal(false)} />}

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.14s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
        >← BACK</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onToggleFavorite({ mode, route, stop })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: faved ? 'rgba(232,197,71,0.12)' : 'transparent', border: `1px solid ${faved ? 'var(--accent)' : 'var(--border)'}`, color: faved ? 'var(--accent)' : 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.14s' }}
            onMouseEnter={e => { if (!faved) { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}}
            onMouseLeave={e => { if (!faved) { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-dim)' }}}
          >
            <span style={{ fontSize: 14 }}>{faved ? '★' : '☆'}</span>
            <span>{faved ? 'SAVED' : 'SAVE'}</span>
          </button>
          <button onClick={refresh} disabled={loading}
            style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 12, cursor: loading ? 'default' : 'pointer', transition: 'all 0.14s', opacity: loading ? 0.5 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor='var(--accent)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >{loading ? <Spinner size={12} /> : '⟳'}</button>
        </div>
      </div>

      {/* Map */}
      <div style={{ marginBottom: 20 }}>
        <StopMap stop={stop} accent={lc.accent} isCR={isCR} onOpenCRModal={() => setCRModal(true)} />
      </div>

      {/* Station header */}
      <div style={{ paddingLeft: 18, marginBottom: 14, borderLeft: `3px solid ${lc.accent}` }}>
        <MonoLabel style={{ display: 'block', marginBottom: 6 }}>
          {mode?.label}{route?.attributes?.short_name ? ` · ${route.attributes.short_name}` : route?.id ? ` · ${route.id}` : ''}
        </MonoLabel>
        <StopDropdown route={route} currentStop={stop} onSelect={setStop} />
        {stop?.attributes?.municipality && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.08em' }}>
            {stop.attributes.municipality}{stop.attributes?.platform_name ? ` · ${stop.attributes.platform_name}` : ''}
          </div>
        )}
      </div>

      {/* Line chips */}
      <LineChips stopId={stop?.id} activeRouteId={route?.id} onSelect={handleRouteChipSelect} />

      {/* Alerts — reset index on every new alerts array (guards against stale display) */}
      <AlertBanner alerts={alerts} />
      <ErrorBox message={error} style={{ marginBottom: 16 }} />

      {/* Arrivals */}
      {loading && !groups.length
        ? <div>{[1,2,3].map(i => <SkeletonRow key={i} cols={[2.5, 0.4]} />)}</div>
        : groups.length === 0
        ? <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>No upcoming arrivals found</div>
        : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 20px', borderBottom: `1.5px solid ${lc.accent}55`, background: 'var(--bg-2)' }}>
              <MonoLabel>Destination</MonoLabel>
              <MonoLabel>Min</MonoLabel>
            </div>
            {groups.map((g, i) => <DestinationGroup key={g.headsign} group={g} accent={lc.accent} groupIndex={i} />)}
          </div>
        )
      }

      {/* Status bar */}
      <Divider style={{ marginTop: 20, marginBottom: 10 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LiveDot color={loading ? '#E8C547' : '#3DBA7F'} />
          <span style={{ color: loading ? 'var(--accent)' : 'var(--green)' }}>{loading ? 'REFRESHING' : 'LIVE'}</span>
          {lastFetch && <span>· {lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
        </div>
        <span>{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · ↻ 20s</span>
      </div>
    </div>
  )
}
