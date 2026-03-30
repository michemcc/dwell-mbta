import React, { useState, useRef, useEffect, useCallback } from 'react'
import { mbtaFetch, getLineColor, formatCountdown, COUNTDOWN_COLORS } from '../utils/mbta'
import { useStopSearch, useRoutesForStop, useClock } from '../hooks/index'
import { MonoLabel, Spinner, LiveDot, ErrorBox } from './Primitives'

// ── StopPicker ────────────────────────────────────────────────────────────────
function StopPicker({ label, value, onSelect, placeholder }) {
  const [query, setQuery]    = useState(value?.attributes?.name || '')
  const [open, setOpen]      = useState(false)
  const { results, loading } = useStopSearch(query)
  const wrapRef  = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { setQuery(value?.attributes?.name || '') }, [value?.id])

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <MonoLabel style={{ display: 'block', marginBottom: 6 }}>{label}</MonoLabel>
      <div style={{ position: 'relative' }}>
        <input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); onSelect(null); setOpen(true) }}
          placeholder={placeholder}
          style={{
            width: '100%', background: 'var(--bg-3)',
            border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 28px 10px 12px',
            letterSpacing: '0.04em', outline: 'none',
          }}
          onFocus={e => { setOpen(true); e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {value && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontSize: 12 }}>✓</span>
        )}
      </div>
      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-md)', zIndex: 500,
          boxShadow: '0 8px 24px var(--shadow)', maxHeight: 220, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size={11} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>Searching…</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>No stops found</div>
          )}
          {results.map(s => (
            <button key={s.id}
              onMouseDown={async e => {
                e.preventDefault()
                setOpen(false)
                setQuery(s.attributes?.name || '')
                // Always resolve to parent station so predictions work correctly
                const resolved = await resolveParentStop(s)
                onSelect(resolved)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>◆</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.attributes?.name}
                </div>
                {s.attributes?.municipality && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', marginTop: 1 }}>{s.attributes.municipality}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Journey card ──────────────────────────────────────────────────────────────
function JourneyCard({ journey }) {
  const { legs } = journey
  const firstLeg = legs[0]
  const lastLeg  = legs[legs.length - 1]
  const isTransfer = legs.length > 1
  const [liveLabels, setLiveLabels] = useState(() => legs.map(l => formatCountdown(l.departureTime).label))

  useEffect(() => {
    const t = setInterval(() => {
      setLiveLabels(legs.map(l => formatCountdown(l.departureTime).label))
    }, 1000)
    return () => clearInterval(t)
  }, [legs])

  const firstCd  = formatCountdown(firstLeg.departureTime)
  const depColor = COUNTDOWN_COLORS[firstCd.tier] || 'var(--text)'
  const urgent   = firstCd.tier === 'boarding' || firstCd.tier === 'now' || firstCd.tier === 'soon'
  const lc1      = getLineColor(firstLeg.route?.id || '')
  const lc2      = legs[1] ? getLineColor(legs[1].route?.id || '') : null

  // Total time from first departure to last arrival
  const totalStart = firstLeg.departureTime ? new Date(firstLeg.departureTime).getTime() : null
  const totalEnd   = lastLeg.arrivalTime   ? new Date(lastLeg.arrivalTime).getTime()   : null
  const totalMins  = totalStart && totalEnd ? Math.round((totalEnd - totalStart) / 60000) : null

  return (
    <div style={{
      border: `1px solid ${urgent ? lc1.accent + '88' : 'var(--border)'}`,
      borderLeft: `3px solid ${lc1.accent}`,
      borderRadius: 'var(--radius-md)',
      background: urgent ? `${lc1.accent}06` : 'var(--bg-3)',
      overflow: 'hidden', transition: 'all 0.2s',
    }}>
      {/* Header: route(s) + countdown */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Route chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <RouteChip route={firstLeg.route} />
          {isTransfer && (
            <>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>→ transfer →</span>
              <RouteChip route={legs[1].route} />
            </>
          )}
          {totalMins && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', marginLeft: 4 }}>
              {totalMins} min total
            </span>
          )}
        </div>
        {/* Live countdown to first departure */}
        <span style={{
          fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18,
          color: depColor,
          textShadow: urgent ? `0 0 12px ${depColor}66` : 'none',
          letterSpacing: '0.02em', flexShrink: 0,
        }}>
          {liveLabels[0]}
        </span>
      </div>

      {/* Journey legs */}
      <div style={{ padding: '14px 16px' }}>
        {legs.map((leg, li) => (
          <div key={li}>
            {li > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 6px 21px',
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em',
              }}>
                <span>⇄ TRANSFER at {leg.fromStop?.attributes?.name}</span>
                <span style={{ color: 'var(--accent)', fontSize: 11 }}>{liveLabels[li]}</span>
              </div>
            )}
            <LegDetail leg={leg} lc={getLineColor(leg.route?.id || '')} isLast={li === legs.length - 1} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RouteChip({ route }) {
  if (!route) return null
  const lc    = getLineColor(route.id)
  const label = route.attributes?.short_name || route.attributes?.long_name?.split(' ')[0] || route.id
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999, flexShrink: 0,
      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      background: lc.accent + '22', border: `1.5px solid ${lc.accent}66`,
      color: lc.accent,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: lc.accent, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function LegDetail({ leg, lc, isLast }) {
  const { fromStop, toStop, departureTime, arrivalTime, headsign, durationMins } = leg
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
      {/* Timeline line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 12, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc.accent, marginTop: 4 }} />
        <div style={{ width: 1.5, flex: 1, background: `${lc.accent}44`, margin: '3px 0' }} />
        <div style={{ width: 8, height: 8, borderRadius: 2, background: lc.accent, marginBottom: 4 }} />
      </div>
      {/* Text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>
            {fromStop?.attributes?.name}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.06em' }}>
            Departs {departureTime ? new Date(departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            {headsign ? ` · toward ${headsign}` : ''}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>
            {toStop?.attributes?.name}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.06em' }}>
            Arrives {arrivalTime ? new Date(arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            {durationMins ? ` · ${durationMins} min ride` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Transfer routing helpers ──────────────────────────────────────────────────
// Find transfer stops: stops that serve routes from BOTH sets
// Known MBTA transfer hubs — parent station IDs.
// Checking these first avoids hundreds of API calls.
const TRANSFER_HUBS = [
  'place-north',  // North Station  (CR + Orange + Green)
  'place-sstat',  // South Station  (CR + Red + Silver)
  'place-dwnxg',  // Downtown Crossing (Red + Orange + Silver)
  'place-pktrm',  // Park Street   (Red + Green)
  'place-gover',  // Government Center (Blue + Green)
  'place-state',  // State          (Orange + Blue)
  'place-haecl',  // Haymarket     (Orange + Green)
  'place-boyls',  // Boylston      (Green)
  'place-armnl',  // Arlington     (Green)
  'place-coecl',  // Copley        (Green)
  'place-hymnl',  // Hynes         (Green)
  'place-kencl',  // Kenmore       (Green)
  'place-jfk',    // JFK/UMass     (Red)
  'place-forhl',  // Forest Hills  (Orange + CR)
  'place-rugg',   // Ruggles       (Orange + CR)
  'place-bbsta',  // Back Bay      (Orange + CR)
  'place-masta',  // Massachusetts Ave (Orange)
  'place-ogmnl',  // Oak Grove     (Orange)
  'place-asmnl',  // Alewife       (Red)
]

async function resolveParentStop(rawStop) {
  const parentId = rawStop.relationships?.parent_station?.data?.id
  if (!parentId) return rawStop
  try {
    const d = await mbtaFetch(`/stops/${parentId}`)
    return d.data || rawStop
  } catch { return rawStop }
}

// Get routes serving a stop, using parent station ID for reliability
async function getRoutesForStop(stopId) {
  const d = await mbtaFetch(`/routes?filter[stop]=${stopId}&sort=sort_order`)
  return d.data || []
}

async function findTransferJourneys(fromStop, toStop, fromRoutes, toRoutes, toRouteIds) {
  const results = []

  // Strategy: check known transfer hubs first (fast), then fall back to
  // scanning each fromRoute's stops (thorough but slow).
  
  // Build a Set of fromRoute IDs for quick lookup
  const fromRouteIds = new Set(fromRoutes.map(r => r.id))

  // Step 1: check known hubs — if a hub serves both a fromRoute and a toRoute, it's a transfer
  const hubCandidates = []
  await Promise.all(TRANSFER_HUBS.map(async hubId => {
    // Skip if hub is the origin or destination
    if (hubId === fromStop.id || hubId === toStop.id) return
    try {
      const hubRoutes = await getRoutesForStop(hubId)
      const servesFrom = hubRoutes.some(r => fromRouteIds.has(r.id))
      const toRoute    = hubRoutes.find(r => toRouteIds.has(r.id))
      const fromRoute  = hubRoutes.find(r => fromRouteIds.has(r.id))
      if (servesFrom && toRoute && fromRoute) {
        hubCandidates.push({ hubId, fromRoute, toRoute })
      }
    } catch {}
  }))

  // Step 2: if no hub candidates, scan fromRoute stops (slower)
  const routeCandidates = []
  if (hubCandidates.length === 0) {
    await Promise.all(fromRoutes.slice(0, 4).map(async fromRoute => {
      try {
        const fromStopsData = await mbtaFetch(`/stops?filter[route]=${fromRoute.id}`)
        const rawStops = fromStopsData.data || []
        // Deduplicate by parent station
        const stationMap = new Map()
        for (const s of rawStops) {
          const pid = s.relationships?.parent_station?.data?.id || s.id
          if (!stationMap.has(pid)) stationMap.set(pid, s)
        }
        for (const [pid, rawStop] of stationMap) {
          if (pid === fromStop.id || pid === toStop.id) continue
          try {
            const stopRoutes = await getRoutesForStop(pid)
            const toRoute = stopRoutes.find(r => toRouteIds.has(r.id))
            if (toRoute) routeCandidates.push({ hubId: pid, fromRoute, toRoute })
          } catch {}
        }
      } catch {}
    }))
  }

  const allCandidates = [...hubCandidates, ...routeCandidates].slice(0, 4)
  if (allCandidates.length === 0) return results

  // Step 3: for each transfer hub, find predictions for both legs
  await Promise.all(allCandidates.map(async ({ hubId, fromRoute, toRoute }) => {
    try {
      // Fetch the hub stop record for display
      let hubStop
      try {
        const hs = await mbtaFetch(`/stops/${hubId}`)
        hubStop = hs.data
      } catch { hubStop = { id: hubId, attributes: { name: hubId } } }

      // Leg 1: from → hub on fromRoute
      // Try predictions first; fall back to schedules for CR where predictions
      // are only published ~60 min ahead
      let leg1Data = await mbtaFetch(
        `/predictions?filter[stop]=${fromStop.id}&filter[route]=${fromRoute.id}` +
        `&sort=departure_time&include=trip&page[limit]=6`
      )
      if (!leg1Data.data?.length) {
        // Fallback: use schedules (further-out CR departures)
        try {
          leg1Data = await mbtaFetch(
            `/schedules?filter[stop]=${fromStop.id}&filter[route]=${fromRoute.id}` +
            `&filter[min_time]=${new Date().toTimeString().slice(0,5)}` +
            `&sort=departure_time&include=trip&page[limit]=6`
          )
        } catch {}
      }
      const leg1Preds = leg1Data
      const leg1Trips = {}
      ;(leg1Preds.included || []).forEach(inc => {
        if (inc.type === 'trip') leg1Trips[inc.id] = inc.attributes?.headsign || ''
      })

      for (const pred1 of (leg1Preds.data || []).slice(0, 2)) {
        const dep1 = pred1.attributes?.departure_time || pred1.attributes?.arrival_time
        if (!dep1 || new Date(dep1) < Date.now() - 30000) continue
        const tripId1    = pred1.relationships?.trip?.data?.id
        const headsign1  = pred1.attributes?.headsign || leg1Trips[tripId1] || fromRoute.attributes?.long_name || fromRoute.id

        // Arrival at hub for this trip
        let arr1 = null
        if (tripId1) {
          try {
            const a1 = await mbtaFetch(`/predictions?filter[stop]=${hubId}&filter[trip]=${tripId1}&page[limit]=1`)
            arr1 = a1.data?.[0]?.attributes?.arrival_time || a1.data?.[0]?.attributes?.departure_time
          } catch {}
        }

        // Leg 2: hub → toStop on toRoute (must depart after arr1)
        const leg2Preds = await mbtaFetch(
          `/predictions?filter[stop]=${hubId}&filter[route]=${toRoute.id}` +
          `&sort=departure_time&include=trip&page[limit]=12`
        )
        const leg2Trips = {}
        ;(leg2Preds.included || []).forEach(inc => {
          if (inc.type === 'trip') leg2Trips[inc.id] = inc.attributes?.headsign || ''
        })

        // Estimate arrival at hub: use actual prediction if available,
        // else assume 45 min (conservative for CR routes like Salem→North Station)
        const arrMs = arr1 ? new Date(arr1).getTime() : new Date(dep1).getTime() + 45 * 60000
        for (const pred2 of (leg2Preds.data || [])) {
          const dep2 = pred2.attributes?.departure_time || pred2.attributes?.arrival_time
          if (!dep2) continue
          const dep2Ms = new Date(dep2).getTime()
          if (dep2Ms < arrMs) continue  // must be after arrival at hub

          const tripId2   = pred2.relationships?.trip?.data?.id
          const headsign2 = pred2.attributes?.headsign || leg2Trips[tripId2] || toRoute.attributes?.long_name || toRoute.id

          // Arrival at destination
          let arr2 = null
          if (tripId2) {
            try {
              const a2 = await mbtaFetch(`/predictions?filter[stop]=${toStop.id}&filter[trip]=${tripId2}&page[limit]=1`)
              arr2 = a2.data?.[0]?.attributes?.arrival_time || a2.data?.[0]?.attributes?.departure_time
            } catch {}
          }

          results.push({
            id: `${pred1.id}-${pred2.id}`,
            legs: [
              { route: fromRoute, fromStop, toStop: hubStop, departureTime: dep1, arrivalTime: arr1, headsign: headsign1, durationMins: arr1 ? Math.round((new Date(arr1) - new Date(dep1)) / 60000) : null },
              { route: toRoute,   fromStop: hubStop, toStop, departureTime: dep2, arrivalTime: arr2, headsign: headsign2, durationMins: arr2 ? Math.round((new Date(arr2) - dep2Ms) / 60000) : null },
            ],
          })
          break  // one connection per hub per leg1 trip
        }
      }
    } catch {}
  }))

  return results
}


// ── NextTrain — main export ───────────────────────────────────────────────────
export default function NextTrain() {
  const [fromStop, setFromStop] = useState(null)
  const [toStop, setToStop]     = useState(null)
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [searched, setSearched] = useState(false)
  const clock = useClock()

  const findJourneys = useCallback(async () => {
    if (!fromStop || !toStop) return
    setLoading(true); setError(null); setSearched(true); setJourneys([])

    try {
      // Ensure we always use parent station IDs — child stop IDs cause
      // the MBTA predictions API to return empty results
      const [resolvedFrom, resolvedTo] = await Promise.all([
        resolveParentStop(fromStop),
        resolveParentStop(toStop),
      ])
      // Reassign so all downstream code uses the resolved stops
      const fromStopR = resolvedFrom
      const toStopR   = resolvedTo

      const [fromRoutesData, toRoutesData] = await Promise.all([
        mbtaFetch(`/routes?filter[stop]=${fromStopR.id}&sort=sort_order`),
        mbtaFetch(`/routes?filter[stop]=${toStopR.id}&sort=sort_order`),
      ])
      const fromRoutes = fromRoutesData.data || []
      const toRouteIds = new Set((toRoutesData.data || []).map(r => r.id))

      // 1. Try direct routes first
      const sharedRoutes = fromRoutes.filter(r => toRouteIds.has(r.id))
      const directJourneys = []

      if (sharedRoutes.length > 0) {
        await Promise.all(sharedRoutes.slice(0, 4).map(async route => {
          try {
            const predData = await mbtaFetch(
              `/predictions?filter[stop]=${fromStopR.id}&filter[route]=${route.id}` +
              `&sort=departure_time&include=trip&page[limit]=4`
            )
            const tripMap = {}
            ;(predData.included || []).forEach(inc => {
              if (inc.type === 'trip') tripMap[inc.id] = inc.attributes?.headsign || ''
            })
            for (const pred of (predData.data || []).slice(0, 3)) {
              const depTime  = pred.attributes?.departure_time || pred.attributes?.arrival_time
              if (!depTime || new Date(depTime) < Date.now() - 30000) continue
              const tripId   = pred.relationships?.trip?.data?.id
              const headsign = pred.attributes?.headsign || tripMap[tripId] || route.attributes?.long_name || route.id
              let arrTime = null
              if (tripId) {
                try {
                  const a = await mbtaFetch(`/predictions?filter[stop]=${toStopR.id}&filter[trip]=${tripId}&page[limit]=1`)
                  arrTime = a.data?.[0]?.attributes?.arrival_time || a.data?.[0]?.attributes?.departure_time
                } catch {}
              }
              const depMs  = new Date(depTime).getTime()
              const arrMs  = arrTime ? new Date(arrTime).getTime() : null
              directJourneys.push({
                id:   pred.id,
                legs: [{
                  route, fromStop: fromStopR, toStop: toStopR,
                  departureTime: depTime,
                  arrivalTime:   arrTime,
                  headsign,
                  durationMins: arrMs ? Math.round((arrMs - depMs) / 60000) : null,
                }],
              })
            }
          } catch {}
        }))
      }

      // 2. If no direct routes, find 1-transfer connections
      let transferJourneys = []
      if (directJourneys.length === 0) {
        transferJourneys = await findTransferJourneys(fromStopR, toStopR, fromRoutes, [], toRouteIds)
      }

      const all = [...directJourneys, ...transferJourneys]
        .sort((a, b) => new Date(a.legs[0].departureTime) - new Date(b.legs[0].departureTime))
        .slice(0, 6)

      setJourneys(all)
      if (all.length === 0) {
        setError('No connections found between these stops. They may not be directly or 1-transfer linked on the MBTA network right now.')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fromStop?.id, toStop?.id])

  useEffect(() => {
    if (fromStop && toStop) findJourneys()
  }, [fromStop?.id, toStop?.id])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <MonoLabel>Next Train Finder</MonoLabel>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.12em', marginTop: 3 }}>
            DIRECT & 1-TRANSFER CONNECTIONS · LIVE PREDICTIONS
          </div>
        </div>
        {journeys.length > 0 && (
          <button onClick={findJourneys} disabled={loading}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 11,
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1,
              letterSpacing: '0.08em', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >{loading ? <Spinner size={11} /> : '⟳ REFRESH'}</button>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

      {/* Stop pickers */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <StopPicker label="From" value={fromStop} onSelect={setFromStop} placeholder="e.g. North Station" />
        <button
          onClick={() => { const t = fromStop; setFromStop(toStop); setToStop(t) }}
          style={{
            alignSelf: 'flex-end', marginBottom: 1,
            width: 34, height: 36, borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.14s',
          }}
          title="Swap stops"
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)' }}
        >⇄</button>
        <StopPicker label="To" value={toStop} onSelect={setToStop} placeholder="e.g. South Station" />
      </div>

      {/* Results */}
      {loading && (
        <div style={{ padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Spinner size={14} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
            Finding connections…
          </span>
        </div>
      )}
      {!loading && error && <ErrorBox message={error} style={{ marginTop: 8 }} />}
      {!loading && !error && journeys.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <LiveDot color="#3DBA7F" size={7} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', letterSpacing: '0.12em' }}>LIVE</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
              · Refreshes on every search · Transfer connections may take a moment to load
            </span>
          </div>
          {journeys.map((j, i) => <JourneyCard key={j.id + i} journey={j} />)}
        </div>
      )}
      {!searched && (
        <div style={{ padding: '18px 16px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', lineHeight: 1.8 }}>
            Enter two stops above. DWELL finds direct connections first, then 1-transfer options (e.g. Orange Line → transfer at Downtown Crossing → Red Line).
          </div>
        </div>
      )}
    </div>
  )
}
