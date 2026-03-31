import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatCountdown, COUNTDOWN_COLORS, getLineColor, mbtaFetch } from '../utils/mbta'
import { usePredictions, useClock, useStops, useRoutesForStop, useVehicles } from '../hooks/index'
import { Spinner, LiveDot, MonoLabel, Divider, ErrorBox, SkeletonRow, Pill } from './Primitives'

// ─────────────────────────────────────────────────────────────────────────────
// CR Train Map Modal — interactive, zoomable, pannable live train map
// ─────────────────────────────────────────────────────────────────────────────
function CRTrainModal({ route, onClose }) {
  const { vehicles, loading, refresh } = useVehicles(route?.id, 15000)
  const containerRef = useRef(null)
  const [dims, setDims]           = useState({ w: 0, h: 0 })
  const [zoom, setZoom]           = useState(9)
  const [center, setCenter]       = useState({ lat: 42.36, lng: -71.06 })
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Pointer drag state (ref so no re-renders during drag)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startCenter: null })
  // Pinch state
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 9 })

  const TILE = 256
  const lc   = getLineColor(route?.id)
  // Map height is driven by dims.h (ResizeObserver) not a fixed constant

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) =>
      setDims({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Tile/pixel math ─────────────────────────────────────────────────────────
  const n = Math.pow(2, zoom)

  const lngToTileX = (lng) => (lng + 180) / 360 * n
  const latToTileY = (lat) => {
    const r = lat * Math.PI / 180
    return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n
  }

  // Convert lat/lng to pixel position relative to map center
  const latLngToPixel = useCallback((lat, lng) => {
    const cx = lngToTileX(center.lng)
    const cy = latToTileY(center.lat)
    const px = lngToTileX(lng)
    const py = latToTileY(lat)
    return {
      x: dims.w / 2 + (px - cx) * TILE,
      y: (dims.h || 400) / 2 + (py - cy) * TILE,
    }
  }, [center, zoom, dims.w, dims.h])

  // Convert pixel offset from center back to lat/lng
  const pixelToLatLng = useCallback((px, py) => {
    const cx = lngToTileX(center.lng)
    const cy = latToTileY(center.lat)
    const tileX = cx + (px - dims.w / 2) / TILE
    const tileY = cy + (py - (dims.h || 400) / 2) / TILE
    const lng = tileX / n * 360 - 180
    const latR = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)))
    return { lat: latR * 180 / Math.PI, lng }
  }, [center, zoom, dims.w, dims.h])

  // ── Tile grid ───────────────────────────────────────────────────────────────
  const centerTileX = Math.floor(lngToTileX(center.lng))
  const centerTileY = Math.floor(latToTileY(center.lat))
  const GRID = 5  // 5×5 grid to allow panning without white edges
  const tiles = []
  for (let dy = -Math.floor(GRID/2); dy <= Math.floor(GRID/2); dy++)
    for (let dx = -Math.floor(GRID/2); dx <= Math.floor(GRID/2); dx++) {
      const tx = centerTileX + dx
      const ty = centerTileY + dy
      if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue
      const s = ['a','b','c'][(Math.abs(tx + ty)) % 3]
      const tilePos = latLngToPixel(
        (Math.atan(Math.sinh(Math.PI * (1 - 2 * (ty + 0.5) / n))) * 180 / Math.PI),
        ((tx + 0.5) / n * 360 - 180)
      )
      tiles.push({ key: `${zoom}-${tx}-${ty}`, url: `https://${s}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`, tx, ty })
    }

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const clampZoom = (z) => Math.max(7, Math.min(14, z))

  const zoomAt = useCallback((newZoom, pivotX, pivotY) => {
    // Keep the point under the cursor/pinch fixed when zooming
    const pivotLatLng = pixelToLatLng(pivotX, pivotY)
    setZoom(z => {
      const clamped = clampZoom(newZoom)
      if (clamped === z) return z
      return clamped
    })
    setCenter(pivotLatLng)
  }, [pixelToLatLng])

  // ── Pointer drag handlers ────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (e.touches?.length === 2) return  // let pinch handler take over
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startCenter: { ...center } }
    setIsDragging(false)
  }

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setIsDragging(true)
    const sc = dragRef.current.startCenter
    // Move center by the opposite of the drag delta
    const newCenter = pixelToLatLng(dims.w / 2 - dx, (dims.h || 400) / 2 - dy)
    // But we want the startCenter reference point, not current center
    const cxT = lngToTileX(sc.lng)
    const cyT = latToTileY(sc.lat)
    const newTileX = cxT - dx / TILE
    const newTileY = cyT - dy / TILE
    const newLng = newTileX / n * 360 - 180
    const newLatR = Math.atan(Math.sinh(Math.PI * (1 - 2 * newTileY / n)))
    setCenter({ lat: newLatR * 180 / Math.PI, lng: newLng })
  }

  const onPointerUp = (e) => {
    dragRef.current.active = false
    setTimeout(() => setIsDragging(false), 50)
  }

  // ── Pinch-to-zoom (touch) ────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = {
        active: true,
        startDist: Math.hypot(dx, dy),
        startZoom: zoom,
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
      dragRef.current.active = false
    }
  }

  const onTouchMove = (e) => {
    if (!pinchRef.current.active || e.touches.length !== 2) return
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.hypot(dx, dy)
    const scale = dist / pinchRef.current.startDist
    const newZoom = clampZoom(Math.round(pinchRef.current.startZoom + Math.log2(scale)))
    if (newZoom !== zoom) {
      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
      zoomAt(newZoom, pinchRef.current.midX - rect.left, pinchRef.current.midY - rect.top)
    }
  }

  const onTouchEnd = () => { pinchRef.current.active = false }

  // ── Scroll wheel zoom ────────────────────────────────────────────────────────
  const onWheel = (e) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
    const pivotX = e.clientX - rect.left
    const pivotY = e.clientY - rect.top
    const delta  = e.deltaY > 0 ? -1 : 1
    zoomAt(zoom + delta, pivotX, pivotY)
  }

  // ── Fit all trains button ────────────────────────────────────────────────────
  const fitTrains = () => {
    const active = vehicles.filter(v => v.attributes?.latitude && v.attributes?.longitude)
    if (!active.length) return
    if (active.length === 1) {
      setCenter({ lat: active[0].attributes.latitude, lng: active[0].attributes.longitude })
      setZoom(12)
      return
    }
    const lats = active.map(v => v.attributes.latitude)
    const lngs = active.map(v => v.attributes.longitude)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    setCenter({ lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 })
    // Pick zoom level that fits the bounding box
    const latSpan = maxLat - minLat + 0.05
    const lngSpan = maxLng - minLng + 0.05
    const fitZoom = Math.floor(Math.min(
      Math.log2(dims.h / TILE / (latSpan / 180 * 256)),
      Math.log2(dims.w / TILE / (lngSpan / 360 * 256))
    ))
    setZoom(clampZoom(fitZoom))
  }

  const activeVehicles = vehicles.filter(v => v.attributes?.latitude && v.attributes?.longitude)

  // Close selected vehicle when clicking backdrop
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  const isMobileLayout = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(5,6,10,0.9)', backdropFilter: 'blur(10px)',
      display: 'flex',
      // Mobile: bottom sheet anchored to bottom of screen
      // Desktop: centered dialog taking up most of the viewport
      alignItems: isMobileLayout ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobileLayout ? '0' : '24px 16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: isMobileLayout ? '100%' : '900px',
        // Mobile: 90% of screen height so map is large and comfortable
        // Desktop: nearly full viewport height
        height: isMobileLayout ? '90vh' : 'min(88vh, 800px)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-2)',
        borderRadius: isMobileLayout ? '20px 20px 0 0' : '16px',
        border: '1px solid var(--border-mid)',
        overflow: 'hidden', animation: 'fadeUp 0.22s ease both',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* Mobile drag handle */}
        {isMobileLayout && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-mid)' }} />
          </div>
        )}

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-3)', flexShrink: 0,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: lc.accent, boxShadow: `0 0 8px ${lc.accent}`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {route?.attributes?.long_name || route?.id}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.07em', marginTop: 1 }}>
              {loading
                ? 'Loading trains…'
                : `${activeVehicles.length} train${activeVehicles.length !== 1 ? 's' : ''} on this route · scroll/pinch to zoom · drag to pan`
              }
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!loading && activeVehicles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <LiveDot color="#3FCF84" size={6} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', letterSpacing: '0.1em' }}>LIVE</span>
              </div>
            )}
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-4)', border: '1px solid var(--border-mid)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.14s', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-4)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >✕</button>
          </div>
        </div>

        {/* ── Map ── */}
        <div
          ref={containerRef}
          style={{ position: 'relative', width: '100%', flex: 1, minHeight: 280, background: '#0a0c10', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          {/* Tile images */}
          {dims.w > 0 && (() => {
            const renderedTiles = []
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                const tx = centerTileX + dx
                const ty = centerTileY + dy
                if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue
                const tileLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (ty + 0.5) / n))) * 180 / Math.PI
                const tileLng = (tx + 0.5) / n * 360 - 180
                const tileCornerLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * ty / n))) * 180 / Math.PI
                const tileCornerLng = tx / n * 360 - 180
                const cornerPx = latLngToPixel(tileCornerLat, tileCornerLng)
                const s = ['a','b','c'][(Math.abs(tx + ty)) % 3]
                renderedTiles.push(
                  <img key={`${zoom}-${tx}-${ty}`}
                    src={`https://${s}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`}
                    style={{
                      position: 'absolute',
                      left: cornerPx.x, top: cornerPx.y,
                      width: TILE, height: TILE,
                      display: 'block',
                      filter: 'brightness(0.45) saturate(0.5)',
                      imageRendering: 'pixelated',
                    }}
                    crossOrigin="anonymous" alt="" draggable={false}
                  />
                )
              }
            }
            return renderedTiles
          })()}

          {/* Vignette */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,6,10,0.55) 100%)' }} />

          {/* Train markers */}
          {dims.w > 0 && activeVehicles.map(v => {
            const lat     = v.attributes.latitude
            const lng     = v.attributes.longitude
            const bearing = v.attributes?.bearing
            const status  = v.attributes?.current_status || ''
            const label   = v.attributes?.label || v.id.slice(-4)
            const speed   = v.attributes?.speed
            const isMoving    = status === 'IN_TRANSIT_TO'
            const isBoarding  = status === 'STOPPED_AT'
            const isSelected  = selectedVehicle?.id === v.id
            const { x, y } = latLngToPixel(lat, lng)

            // Skip off-screen (with margin)
            if (x < -40 || x > dims.w + 40 || y < -40 || y > (dims.h || 400) + 40) return null

            const markerSize = isSelected ? 40 : isMoving ? 32 : 26

            return (
              <div key={v.id} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', zIndex: isSelected ? 50 : isMoving ? 20 : 10 }}>
                {/* Pulse ring for boarding */}
                {isBoarding && (
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${lc.accent}`, animation: 'pulse-dot 2s ease-out infinite', pointerEvents: 'none' }} />
                )}

                {/* Marker button */}
                <button
                  onClick={e => { e.stopPropagation(); setSelectedVehicle(isSelected ? null : v) }}
                  style={{
                    width: markerSize, height: markerSize, borderRadius: '50%',
                    background: isSelected ? lc.accent : isBoarding ? `${lc.accent}dd` : 'rgba(10,12,18,0.92)',
                    border: `2.5px solid ${isSelected ? '#fff' : lc.accent}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 ${isSelected ? 20 : isMoving ? 12 : 6}px ${lc.accent}${isSelected ? 'cc' : '66'}`,
                    cursor: 'pointer', padding: 0, outline: 'none',
                    transition: 'all 0.2s',
                    position: 'relative', overflow: 'visible',
                  }}
                >
                  {/* Direction arrow — SVG outside the marker circle, clearly visible */}
                  {bearing != null && (
                    <svg
                      width="56" height="56"
                      viewBox="0 0 56 56"
                      style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        marginTop: -28, marginLeft: -28,
                        transform: `rotate(${bearing}deg)`,
                        pointerEvents: 'none',
                        overflow: 'visible',
                        zIndex: 10,
                        filter: `drop-shadow(0 0 5px ${lc.accent})`,
                        opacity: isMoving ? 1 : 0.5,
                      }}
                    >
                      {/* Stem: from just outside the marker (y=20) to near top (y=6) */}
                      <line x1="28" y1="20" x2="28" y2="8"
                        stroke={lc.accent} strokeWidth="3" strokeLinecap="round" />
                      {/* Arrowhead: solid filled triangle at the tip */}
                      <polygon points="28,2 22,12 34,12"
                        fill={lc.accent} />
                    </svg>
                  )}
                  {/* Train icon — counter-rotated so it stays upright */}
                  <span style={{ fontSize: isSelected ? 16 : 12, lineHeight: 1, userSelect: 'none', color: isSelected ? '#000' : lc.accent }}>🚆</span>
                </button>

                {/* Label below marker */}
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginTop: 4, padding: '2px 6px',
                  background: 'rgba(5,6,10,0.92)', border: `1px solid ${lc.accent}55`,
                  borderRadius: 4, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                  color: lc.accent, letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}>{label}</div>
              </div>
            )
          })}

          {/* Selected vehicle detail popup */}
          {selectedVehicle && dims.w > 0 && (() => {
            const { x, y } = latLngToPixel(selectedVehicle.attributes.latitude, selectedVehicle.attributes.longitude)
            const popupW = 200
            const popupH = 100
            const popupX = Math.max(8, Math.min(dims.w - popupW - 8, x - popupW / 2))
            const popupY = y - popupH - 52  // above the marker
            const sv = selectedVehicle
            const status  = sv.attributes?.current_status?.replace(/_/g, ' ').toLowerCase() || '—'
            const speed   = sv.attributes?.speed != null ? `${Math.round(sv.attributes.speed)} km/h` : null
            const bearing = sv.attributes?.bearing != null ? `${Math.round(sv.attributes.bearing)}°` : null
            const label   = sv.attributes?.label || sv.id.slice(-4)
            return (
              <div style={{
                position: 'absolute', left: popupX, top: Math.max(8, popupY),
                width: popupW, background: 'rgba(9,12,18,0.97)',
                border: `1px solid ${lc.accent}66`, borderRadius: 8,
                padding: '10px 12px', zIndex: 60,
                boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${lc.accent}22`,
                pointerEvents: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: lc.accent }}>Train {label}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.9 }}>
                  <div style={{ textTransform: 'capitalize' }}>{status}</div>
                  {sv._stopName && (
                    <div style={{ color: 'var(--text)' }}>
                      {sv.attributes?.current_status === 'IN_TRANSIT_TO' ? '→ ' : '@ '}
                      {sv._stopName}
                    </div>
                  )}
                  {sv._headsign && <div style={{ color: 'var(--text-dim)' }}>Toward {sv._headsign}</div>}
                  {speed && <div>{speed}</div>}
                  {bearing && <div>Hdg {bearing}</div>}
                </div>
              </div>
            )
          })()}

          {/* Zoom controls */}
          <div style={{ position: 'absolute', right: 12, bottom: 28, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 30 }}>
            <button onClick={() => setZoom(z => clampZoom(z + 1))} style={{
              width: 36, height: 36, background: 'rgba(9,12,18,0.92)', border: '1px solid var(--border-mid)',
              borderRadius: 8, color: 'var(--text)', fontSize: 20, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 300, transition: 'all 0.14s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = lc.accent; e.currentTarget.style.color = lc.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text)' }}
            >+</button>
            <button onClick={() => setZoom(z => clampZoom(z - 1))} style={{
              width: 36, height: 36, background: 'rgba(9,12,18,0.92)', border: '1px solid var(--border-mid)',
              borderRadius: 8, color: 'var(--text)', fontSize: 20, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 300, transition: 'all 0.14s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = lc.accent; e.currentTarget.style.color = lc.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text)' }}
            >−</button>
          </div>

          {/* Fit all trains button */}
          {activeVehicles.length > 0 && (
            <button onClick={fitTrains} style={{
              position: 'absolute', left: 12, bottom: 28, zIndex: 30,
              padding: '7px 12px', background: 'rgba(9,12,18,0.92)',
              border: '1px solid var(--border-mid)', borderRadius: 8,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.14s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = lc.accent; e.currentTarget.style.color = lc.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >⊡ FIT ALL</button>
          )}

          {/* Zoom level indicator */}
          <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(9,12,18,0.7)', borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', pointerEvents: 'none', zIndex: 10 }}>
            z{zoom}
          </div>

          {/* OSM attribution */}
          <div style={{ position: 'absolute', bottom: 6, right: 8, fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 5 }}>
            © OpenStreetMap
          </div>

          {/* Empty state */}
          {!loading && activeVehicles.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 28 }}>🚆</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>No active trains on this route</span>
            </div>
          )}

          {loading && activeVehicles.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Spinner size={14} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>Loading trains…</span>
            </div>
          )}
        </div>

        {/* ── Train list ── */}
        {activeVehicles.length > 0 && (
          <div style={{ maxHeight: 160, overflowY: 'auto', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            {activeVehicles.map(v => {
              const status  = v.attributes?.current_status?.replace(/_/g, ' ') || '—'
              const label   = v.attributes?.label || v.id.slice(-4)
              const speed   = v.attributes?.speed
              const isSelected = selectedVehicle?.id === v.id
              return (
                <div key={v.id}
                  onClick={() => {
                    setSelectedVehicle(isSelected ? null : v)
                    if (!isSelected) setCenter({ lat: v.attributes.latitude, lng: v.attributes.longitude })
                    if (!isSelected && zoom < 11) setZoom(12)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px',
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? `${lc.accent}0e` : 'transparent',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-3)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? `${lc.accent}0e` : 'transparent' }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc.accent, flexShrink: 0, boxShadow: `0 0 6px ${lc.accent}` }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: isSelected ? lc.accent : 'var(--text)', minWidth: 52 }}>Train {label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'capitalize' }}>
                      {status.toLowerCase()}
                      {v._stopName ? ` · ${status === 'IN_TRANSIT_TO' ? '→ ' : '@ '}${v._stopName}` : ''}
                    </div>
                    {v._headsign && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.04em', marginTop: 1 }}>
                        Toward {v._headsign}
                      </div>
                    )}
                  </div>
                  {speed != null && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.04em', flexShrink: 0 }}>
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
// AlertBanner — horizontal swipe/scroll carousel, one card per alert
// ─────────────────────────────────────────────────────────────────────────────
function AlertBanner({ alerts }) {
  const trackRef  = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart  = useRef(0)
  const scrollStart = useRef(0)

  // Reset scroll when alerts change
  useEffect(() => {
    if (trackRef.current) trackRef.current.scrollLeft = 0
    setActiveIdx(0)
  }, [alerts])

  if (!alerts.length) return null

  // Track which card is in view by scroll position
  const onScroll = () => {
    if (!trackRef.current) return
    const w     = trackRef.current.clientWidth
    const idx   = Math.round(trackRef.current.scrollLeft / w)
    setActiveIdx(Math.min(idx, alerts.length - 1))
  }

  // Mouse drag support for desktop
  const onMouseDown = e => {
    setIsDragging(false)
    dragStart.current  = e.clientX
    scrollStart.current = trackRef.current.scrollLeft
    const onMove = ev => {
      const dx = dragStart.current - ev.clientX
      trackRef.current.scrollLeft = scrollStart.current + dx
      if (Math.abs(dx) > 4) setIsDragging(true)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      // Snap to nearest card
      if (trackRef.current) {
        const w   = trackRef.current.clientWidth
        const idx = Math.round(trackRef.current.scrollLeft / w)
        trackRef.current.scrollTo({ left: idx * w, behavior: 'smooth' })
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="anim-fade-up" style={{ marginBottom: 20 }}>
      {/* Scrollable track */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        style={{
          display: 'flex',
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          // Hide scrollbar visually
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {alerts.map((a, i) => (
          <div key={a.id || i} style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'start',
            display: 'flex', gap: 12, padding: '12px 16px',
            background: 'rgba(232,80,74,0.09)',
            border: '1px solid rgba(232,80,74,0.28)',
            borderLeft: '3px solid var(--red)',
            borderRadius: 'var(--radius-sm)',
            userSelect: 'none',
          }}>
            <span style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.03em', lineHeight: 1.6 }}>
                {a.attributes?.header || 'Service alert'}
              </div>
              {a.attributes?.description && (
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.02em', lineHeight: 1.5 }}>
                  {a.attributes.description.split('\n')[0]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators — only when multiple alerts */}
      {alerts.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {alerts.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (trackRef.current) {
                  trackRef.current.scrollTo({ left: i * trackRef.current.clientWidth, behavior: 'smooth' })
                }
              }}
              style={{
                width: i === activeIdx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIdx ? 'var(--red)' : 'rgba(232,80,74,0.3)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'width 0.25s, background 0.25s',
              }}
            />
          ))}
        </div>
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
  const color   = COUNTDOWN_COLORS[cd.tier] || 'var(--text-muted)'
  const urgent  = cd.tier === 'boarding' || cd.tier === 'now'
  const soon    = cd.tier === 'soon'
  const baseSz  = large ? 18 : 14
  const fontSize = urgent ? baseSz + 2 : soon ? baseSz + 1 : baseSz
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontWeight: urgent || soon ? 800 : 600,
      fontSize, color,
      letterSpacing: urgent ? '0.01em' : '0.03em',
      textShadow: urgent ? `0 0 16px ${color}55` : 'none',
      transition: 'color 0.35s, font-size 0.2s',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}>
      {cd.label}
      {urgent && (
        <span style={{
          display: 'inline-block', marginLeft: 5,
          width: 6, height: 6, borderRadius: '50%',
          background: color, verticalAlign: 'middle',
          animation: 'pulse-dot 1.4s ease-out infinite',
        }} />
      )}
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

  // For branched groups (Southbound = Braintree + Ashmont), the header row
  // can't show a confident countdown because we don't know which branch the
  // next train serves until it's closer. Show "NEXT" label instead, and put
  // individual countdowns on each branch row below.
  const showHeaderCountdown = !isBranched

  return (
    <div className="anim-fade-up" style={{ animationDelay: `${groupIndex * 0.06}s`, borderBottom: '1px solid var(--border)' }}>
      {/* ── Section header ── */}
      <div style={{
        padding: '13px 20px 10px', background: 'var(--bg-3)',
        borderLeft: `3px solid ${accent}`,
      }}>
        {/* Row 1: dot + name + (countdown or NEXT label) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: isBranched ? 8 : 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: accent, boxShadow: `0 0 8px ${accent}99` }} />
            <span style={{
              fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700,
              letterSpacing: '-0.02em', color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {headsign}
            </span>
          </div>
          {showHeaderCountdown
            ? <LiveCountdown isoTime={nextTime} large />
            : <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
                color: 'var(--text-dim)', flexShrink: 0,
              }}>NEXT ↓</span>
          }
        </div>

        {/* Row 2: branch chips (for branched) or destination chip (for non-branched) */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 19 }}>
          {isBranched && branches.length > 0
            ? branches.map(b => <BranchBadge key={b} label={b} accent={accent} />)
            : headsign
              ? <DestGroupChip label={headsign} accent={accent} />
              : null
          }
        </div>
      </div>

      {/* ── Individual trains ── */}
      {predictions.map((p, rowIdx) => {
        // For non-branched: skip the first row (already shown in header)
        if (!isBranched && rowIdx === 0) return null
        const arrTime = p.attributes?.arrival_time || p.attributes?.departure_time
        const isFirst = rowIdx === 0  // first row of a branched group
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: `${isFirst ? 10 : 9}px 20px ${isFirst ? 10 : 9}px 43px`,
            borderTop: '1px solid var(--border)',
            background: isFirst ? `${accent}08` : 'transparent',
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${accent}10`}
            onMouseLeave={e => e.currentTarget.style.background = isFirst ? `${accent}08` : 'transparent'}
          >
            {/* Branch badge (if branched) */}
            {isBranched && p._branch && (
              <BranchBadge label={p._branch} accent={accent} />
            )}
            {/* Scheduled time */}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', flex: 1 }}>
              {arrTime ? new Date(arrTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
            {/* Live countdown on every row */}
            <LiveCountdown isoTime={arrTime} large={isBranched && rowIdx === 0} />
          </div>
        )
      }).filter(Boolean)}
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
          <div className="glass-card" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 20px',
              background: `linear-gradient(90deg, ${lc.accent}18 0%, transparent 100%)`,
              borderBottom: `1px solid ${lc.accent}44`,
            }}>
              <MonoLabel style={{ color: lc.accent, opacity: 0.85 }}>Destination</MonoLabel>
              <MonoLabel style={{ color: lc.accent, opacity: 0.85 }}>Min</MonoLabel>
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
