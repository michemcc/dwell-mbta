import { useState, useEffect, useCallback, useRef } from 'react'
import { mbtaFetch } from '../utils/mbta'

// ── useClock ──────────────────────────────────────────────────────────────────
export function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

// ── useRoutes ─────────────────────────────────────────────────────────────────
export function useRoutes(mode) {
  const [routes, setRoutes]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  useEffect(() => {
    if (!mode) { setRoutes([]); return }
    let cancelled = false
    setRoutes([]); setLoading(true); setError(null)
    mbtaFetch(`/routes?filter[type]=${mode.routeTypes}&sort=sort_order`)
      .then(d => { if (!cancelled) setRoutes(d.data || []) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mode?.id])
  return { routes, loading, error }
}

// ── useStops ──────────────────────────────────────────────────────────────────
export function useStops(route) {
  const [stops, setStops]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  useEffect(() => {
    if (!route) { setStops([]); return }
    let cancelled = false
    setStops([]); setLoading(true); setError(null)
    mbtaFetch(`/stops?filter[route]=${route.id}`)
      .then(d => { if (!cancelled) setStops(d.data || []) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [route?.id])
  return { stops, loading, error }
}

// ── Branch grouping ───────────────────────────────────────────────────────────
const BRANCH_MAP = {
  'braintree':        { parent: 'Southbound', branch: 'Braintree' },
  'ashmont':          { parent: 'Southbound', branch: 'Ashmont'   },
  'boston college':   { parent: 'Westbound',  branch: 'B'         },
  'cleveland circle': { parent: 'Westbound',  branch: 'C'         },
  'riverside':        { parent: 'Westbound',  branch: 'D'         },
  'heath street':     { parent: 'Westbound',  branch: 'E'         },
  'medford/tufts':    { parent: 'Northbound', branch: 'E'         },
  'union square':     { parent: 'Northbound', branch: 'D·E'       },
}
function resolveBranch(headsign) {
  return BRANCH_MAP[headsign.toLowerCase().trim()] || null
}

// ── usePredictions ────────────────────────────────────────────────────────────
// FIX: Use a ref for the "current" stopId/routeId rather than a closure in
// setInterval. This prevents a stale timer from overwriting activeKey with old
// IDs after a route chip switch, which was causing Red Line alerts to persist
// when switching to CR at Porter.
export function usePredictions(stopId, routeId, intervalMs = 20000, stopName = '') {
  const [groups, setGroups]       = useState([])
  const [alerts, setAlerts]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const timerRef   = useRef(null)
  // These refs always hold the CURRENT stopId/routeId, so the interval
  // callback reads them fresh rather than from a stale closure.
  const currentIds = useRef({ stopId, routeId })
  const activeKey  = useRef('')

  // Keep the ref in sync with props on every render
  useEffect(() => {
    currentIds.current = { stopId, routeId }
  })

  const doFetch = useCallback((sid, rid) => {
    if (!sid || !rid) return
    const key = `${sid}::${rid}`
    activeKey.current = key
    setLoading(true)
    Promise.all([
      mbtaFetch(`/predictions?filter[stop]=${sid}&filter[route]=${rid}&sort=arrival_time&include=trip,route&page[limit]=20`),
      // Fetch alerts by STOP only (not by route) so all alerts at the station
      // show regardless of which line is active. A CR-Fitchburg alert at Porter
      // is relevant whether you're looking at Red Line or CR predictions.
      mbtaFetch(`/alerts?filter[stop]=${sid}&filter[lifecycle]=NEW,ONGOING&page[limit]=8`),
    ])
      .then(([pData, aData]) => {
        if (activeKey.current !== key) return  // stale response — discard
        const tripDirections = {}
        ;(pData.included || []).forEach(inc => {
          if (inc.type === 'trip') {
            tripDirections[inc.id] = {
              headsign:    inc.attributes?.headsign    || '',
              directionId: inc.attributes?.direction_id,
            }
          }
        })

        const preds = (pData.data || []).map(p => {
          const tripId   = p.relationships?.trip?.data?.id
          const tripInfo = tripDirections[tripId] || {}
          let rawSign    = p.attributes?.headsign || tripInfo.headsign || p.attributes?.status || '—'

          // If the headsign IS the current stop name, the trip is heading away from here.
          // Use the route's known inbound terminus from the included route data instead.
          if (stopName && rawSign && rawSign.toLowerCase().includes(stopName.toLowerCase())) {
            // Try to use the route's long_name to infer direction, or use "Inbound"
            const routeInc = (pData.included || []).find(
              inc => inc.type === 'route' && inc.id === p.relationships?.route?.data?.id
            )
            // For CR routes the long_name is "Worcester Line" etc — extract terminus
            // Direction 0 is usually outbound, 1 is inbound for MBTA
            const dir = tripInfo.directionId
            if (routeInc?.attributes?.direction_destinations) {
              const dest = routeInc.attributes.direction_destinations[dir === 0 ? 1 : 0]
              if (dest) rawSign = dest
            } else {
              rawSign = 'Inbound'
            }
          }

          const bi = resolveBranch(rawSign)
          return {
            ...p,
            _headsign:   bi ? bi.parent : rawSign,
            _rawSign:    rawSign,
            _branch:     bi?.branch || null,
            _isBranched: !!bi,
          }
        })

        // Filter out predictions that have already fully departed (no time or gone > 90s)
        const now = Date.now()
        const activePreds = preds.filter(p => {
          const t = p.attributes?.arrival_time || p.attributes?.departure_time
          if (!t) return false
          const ms = new Date(t).getTime()
          return ms > now - 90000  // keep if departed less than 90s ago
        })

        const map = new Map()
        activePreds.forEach(p => {
          if (!map.has(p._headsign)) map.set(p._headsign, [])
          map.get(p._headsign).push(p)
        })
        const groupsArr = Array.from(map.entries())
          .map(([headsign, ps]) => {
            const branches = [...new Set(ps.map(p => p._branch).filter(Boolean))]
            return { headsign, isBranched: ps.some(p => p._isBranched), branches, predictions: ps.slice(0, 6) }
          })
          // Only show groups that have at least one non-fully-departed prediction
          .filter(g => g.predictions.some(p => {
            const t = p.attributes?.arrival_time || p.attributes?.departure_time
            if (!t) return false
            return new Date(t).getTime() > now - 90000
          }))
          .sort((a, b) => {
            const ta = a.predictions[0]?.attributes?.arrival_time || a.predictions[0]?.attributes?.departure_time || ''
            const tb = b.predictions[0]?.attributes?.arrival_time || b.predictions[0]?.attributes?.departure_time || ''
            return ta < tb ? -1 : ta > tb ? 1 : 0
          })

        setGroups(groupsArr)
        // Sort alerts: service delays/suspensions first (most actionable),
        // then station issues, then accessibility, then general notices
        const EFFECT_PRIORITY = {
          'DELAY':                   0,
          'SUSPENSION':              1,
          'SHUTTLE':                 2,
          'STOP_MOVED':              3,
          'CANCELLATION':            1,
          'MODIFIED_SERVICE':        2,
          'STATION_CLOSURE':         3,
          'STATION_ISSUE':           4,
          'DETOUR':                  3,
          'STOP_CLOSURE':            3,
          'SCHEDULE_CHANGE':         4,
          'ADDITIONAL_SERVICE':      5,
          'UNKNOWN_EFFECT':          6,
          'ACCESS_ISSUE':            5,
          'POLICY_CHANGE':           6,
          'AMBER_ALERT':             0,
          'DOCK_CLOSURE':            3,
          'ELEVATOR_CLOSURE':        5,
          'ESCALATOR_CLOSURE':       6,
          'BIKE_ISSUE':              7,
          'PARKING_ISSUE':           7,
          'OTHER_EFFECT':            6,
        }
        const sortedAlerts = [...(aData.data || [])].sort((a, b) => {
          const pa = EFFECT_PRIORITY[a.attributes?.effect] ?? 5
          const pb = EFFECT_PRIORITY[b.attributes?.effect] ?? 5
          if (pa !== pb) return pa - pb
          // Within same priority, sort by severity descending (7 = highest)
          const sa = a.attributes?.severity ?? 0
          const sb = b.attributes?.severity ?? 0
          return sb - sa
        })
        setAlerts(sortedAlerts)
        setLastFetch(new Date())
        setError(null)
      })
      .catch(e => { if (activeKey.current === key) setError(e.message) })
      .finally(() => { if (activeKey.current === key) setLoading(false) })
  }, [])  // no deps — reads currentIds.current which is always fresh

  useEffect(() => {
    if (!stopId || !routeId) return
    setGroups([]); setAlerts([]); setError(null)
    doFetch(stopId, routeId)
    clearInterval(timerRef.current)
    // Timer reads from currentIds.current, never from stale closure variables
    timerRef.current = setInterval(() => {
      const { stopId: sid, routeId: rid } = currentIds.current
      doFetch(sid, rid)
    }, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [stopId, routeId, doFetch, intervalMs])

  const refresh = useCallback(() => {
    const { stopId: sid, routeId: rid } = currentIds.current
    doFetch(sid, rid)
  }, [doFetch])

  return { groups, alerts, loading, error, lastFetch, refresh }
}

// ── useStopSearch ─────────────────────────────────────────────────────────────
let _stationCache   = null
let _stationCacheTs = 0
const CACHE_TTL  = 15 * 60 * 1000
const PAGE_SIZE  = 100

async function fetchAllStations() {
  if (_stationCache && Date.now() - _stationCacheTs < CACHE_TTL) return _stationCache
  const parentStops = new Map()
  for (const routeType of ['0,1', '2']) {
    let offset = 0
    for (let page = 0; page < 15; page++) {
      let data
      try { data = await mbtaFetch(`/stops?filter[route_type]=${routeType}&page[limit]=${PAGE_SIZE}&page[offset]=${offset}`) }
      catch { break }
      const batch = data.data || []
      for (const s of batch) {
        const parentId = s.relationships?.parent_station?.data?.id
        const key = parentId || s.id
        if (!parentStops.has(key)) parentStops.set(key, s)
        else if (!parentId) parentStops.set(key, s)
      }
      if (batch.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }
  }
  const byName = new Map()
  for (const s of parentStops.values()) {
    const name = s.attributes?.name || ''
    if (name && !byName.has(name)) byName.set(name, s)
  }
  const all = Array.from(byName.values()).sort((a, b) => (a.attributes?.name || '').localeCompare(b.attributes?.name || ''))
  _stationCache = all; _stationCacheTs = Date.now()
  return all
}

export function useStopSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  useEffect(() => {
    const q = (query || '').trim()
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const stations = await fetchAllStations()
        const ql = q.toLowerCase()
        const matched = stations
          .filter(s => (s.attributes?.name || '').toLowerCase().includes(ql))
          .sort((a, b) => {
            const an = (a.attributes?.name || '').toLowerCase()
            const bn = (b.attributes?.name || '').toLowerCase()
            if (an.startsWith(ql) && !bn.startsWith(ql)) return -1
            if (bn.startsWith(ql) && !an.startsWith(ql)) return 1
            return an.localeCompare(bn)
          })
          .slice(0, 15)
        setResults(matched)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(debounceRef.current)
  }, [query])
  return { results, loading }
}

// ── useRoutesForStop ──────────────────────────────────────────────────────────
export function useRoutesForStop(stopId) {
  const [routes, setRoutes]   = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!stopId) { setRoutes([]); return }
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

// ── useVehicles ───────────────────────────────────────────────────────────────
export function useVehicles(routeId, intervalMs = 15000) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(false)
  const timerRef = useRef(null)
  const doFetch = useCallback(() => {
    if (!routeId) return
    setLoading(true)
    mbtaFetch(`/vehicles?filter[route]=${routeId}&include=stop&page[limit]=50`)
      .then(d => setVehicles(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [routeId])
  useEffect(() => {
    if (!routeId) { setVehicles([]); return }
    doFetch()
    timerRef.current = setInterval(doFetch, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [routeId, doFetch, intervalMs])
  return { vehicles, loading, refresh: doFetch }
}

// ── useFavorites ──────────────────────────────────────────────────────────────
const FAV_KEY = 'dwell:favorites'
function loadFavorites() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || [] } catch { return [] } }
export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites)
  const addFavorite = useCallback((entry) => {
    setFavorites(prev => {
      if (prev.some(f => f.stop.id === entry.stop.id && f.route.id === entry.route.id)) return prev
      const next = [entry, ...prev].slice(0, 12)
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const removeFavorite = useCallback((stopId, routeId) => {
    setFavorites(prev => {
      const next = prev.filter(f => !(f.stop.id === stopId && f.route.id === routeId))
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  const isFavorite = useCallback(
    (stopId, routeId) => favorites.some(f => f.stop.id === stopId && f.route.id === routeId),
    [favorites]
  )
  return { favorites, addFavorite, removeFavorite, isFavorite }
}

// ── useTheme ──────────────────────────────────────────────────────────────────
const THEME_KEY = 'dwell:theme'
export function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' } })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])
  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])
  return { theme, toggle }
}
