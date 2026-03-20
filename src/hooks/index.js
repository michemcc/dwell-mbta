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

// ── useStops — route-sequence order ──────────────────────────────────────────
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
// stopName is used to detect when the headsign IS the current stop (terminus) and flip it
export function usePredictions(stopId, routeId, intervalMs = 20000, stopName = '') {
  const [groups, setGroups]       = useState([])
  const [alerts, setAlerts]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const timerRef  = useRef(null)
  const activeKey = useRef('')

  const doFetch = useCallback((sid, rid) => {
    if (!sid || !rid) return
    const key = `${sid}::${rid}`
    activeKey.current = key
    setLoading(true)
    Promise.all([
      mbtaFetch(`/predictions?filter[stop]=${sid}&filter[route]=${rid}&sort=arrival_time&include=trip,route&page[limit]=20`),
      mbtaFetch(`/alerts?filter[stop]=${sid}&filter[route]=${rid}&filter[lifecycle]=NEW,ONGOING&page[limit]=8`),
    ])
      .then(([pData, aData]) => {
        if (activeKey.current !== key) return
        const tripHeadsigns = {}
        ;(pData.included || []).forEach(inc => {
          if (inc.type === 'trip') tripHeadsigns[inc.id] = inc.attributes?.headsign || ''
        })
        // Build a trip → direction headsign map for reverse lookup
        const tripDirections = {}
        ;(pData.included || []).forEach(inc => {
          if (inc.type === 'trip') {
            tripDirections[inc.id] = {
              headsign: inc.attributes?.headsign || '',
              directionId: inc.attributes?.direction_id,
            }
          }
        })

        const preds = (pData.data || []).map(p => {
          const tripId   = p.relationships?.trip?.data?.id
          const tripInfo = tripDirections[tripId] || {}
          let rawSign    = p.attributes?.headsign || tripInfo.headsign || p.attributes?.status || '—'

          // WORCESTER FIX: If the headsign matches the current stop name (or contains it),
          // the train is labeled with its terminus but the user IS at that terminus heading
          // the other way. Show "Inbound" or try to find the other end from route name.
          // For CR: headsign is usually the distant terminus (e.g. "Worcester" at Worcester).
          // In that case flip to show the inbound direction label.
          if (stopName && rawSign.toLowerCase().includes(stopName.toLowerCase())) {
            // Headsign IS this stop — the trip is labeled with the terminus we are at.
            // Use the route's direction 0 headsign from the trip's direction_id context.
            // Fall back to "Inbound" if we can't determine.
            rawSign = 'Inbound'
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
        const map = new Map()
        preds.forEach(p => {
          if (!map.has(p._headsign)) map.set(p._headsign, [])
          map.get(p._headsign).push(p)
        })
        const groupsArr = Array.from(map.entries())
          .map(([headsign, ps]) => {
            // Collect the unique branch labels present in this group
            const branches = [...new Set(ps.map(p => p._branch).filter(Boolean))]
            return {
              headsign,
              isBranched: ps.some(p => p._isBranched),
              branches,   // e.g. ['Braintree', 'Ashmont'] for Southbound
              predictions: ps.slice(0, 6),
            }
          })
          .sort((a, b) => {
            const ta = a.predictions[0]?.attributes?.arrival_time || a.predictions[0]?.attributes?.departure_time || ''
            const tb = b.predictions[0]?.attributes?.arrival_time || b.predictions[0]?.attributes?.departure_time || ''
            return ta < tb ? -1 : ta > tb ? 1 : 0
          })
        setGroups(groupsArr)
        setAlerts(aData.data || [])
        setLastFetch(new Date())
        setError(null)
      })
      .catch(e => { if (activeKey.current === key) setError(e.message) })
      .finally(() => { if (activeKey.current === key) setLoading(false) })
  }, [])

  useEffect(() => {
    if (!stopId || !routeId) return
    setGroups([]); setAlerts([]); setError(null)
    doFetch(stopId, routeId)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => doFetch(stopId, routeId), intervalMs)
    return () => clearInterval(timerRef.current)
  }, [stopId, routeId, doFetch, intervalMs])

  const refresh = useCallback(() => doFetch(stopId, routeId), [stopId, routeId, doFetch])
  return { groups, alerts, loading, error, lastFetch, refresh }
}

// ── useStopSearch — working client-side stop search ───────────────────────────
//
// APPROACH: Fetch stops using only filter[route_type] (no location_type filter).
// This is the simplest combination that is guaranteed to work per the MBTA v3 spec.
// We get all stops including child stops, then deduplicate by the parent station ID
// (stop.relationships.parent_station.data.id) or by name if no parent.
// Paginate with page[offset] since the API caps page[limit] at 100.
//
// Module-level cache — shared across all instances, never re-fetched within TTL.
let _stationCache    = null
let _stationCacheTs  = 0
const CACHE_TTL = 15 * 60 * 1000
const PAGE_SIZE = 100

async function fetchAllStations() {
  if (_stationCache && Date.now() - _stationCacheTs < CACHE_TTL) return _stationCache

  const parentStops = new Map()  // id → stop, keeps only parent/unique stations

  // Fetch subway (0,1) and commuter rail (2) — no location_type filter
  for (const routeType of ['0,1', '2']) {
    let offset = 0
    for (let page = 0; page < 15; page++) {   // max 1500 stops per type
      let data
      try {
        data = await mbtaFetch(
          `/stops?filter[route_type]=${routeType}&page[limit]=${PAGE_SIZE}&page[offset]=${offset}`
        )
      } catch { break }

      const batch = data.data || []
      for (const s of batch) {
        // Prefer the parent station record; use the stop itself if no parent
        const parentId = s.relationships?.parent_station?.data?.id
        const key      = parentId || s.id
        if (!parentStops.has(key)) {
          // If this stop has a parent_station, we'll replace it when we encounter the parent
          parentStops.set(key, s)
        } else if (!parentId) {
          // This IS the parent station — overwrite the child we stored earlier
          parentStops.set(key, s)
        }
      }

      if (batch.length < PAGE_SIZE) break  // last page
      offset += PAGE_SIZE
    }
  }

  // Convert to array, deduplicate by name (keep first occurrence), sort
  const byName = new Map()
  for (const s of parentStops.values()) {
    const name = s.attributes?.name || ''
    if (name && !byName.has(name)) byName.set(name, s)
  }

  const all = Array.from(byName.values())
    .sort((a, b) => (a.attributes?.name || '').localeCompare(b.attributes?.name || ''))

  _stationCache   = all
  _stationCacheTs = Date.now()
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
            if (bn.startsWith(ql) && !an.startsWith(ql)) return  1
            return an.localeCompare(bn)
          })
          .slice(0, 15)
        setResults(matched)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
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
function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || [] } catch { return [] }
}
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
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])
  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])
  return { theme, toggle }
}
