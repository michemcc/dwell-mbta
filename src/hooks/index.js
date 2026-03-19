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
    mbtaFetch(`/stops?filter[route]=${route.id}&sort=name`)
      .then(d => { if (!cancelled) setStops(d.data || []) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [route?.id])

  return { stops, loading, error }
}

// ── usePredictions ────────────────────────────────────────────────────────────
export function usePredictions(stopId, routeId, intervalMs = 20000) {
  const [predictions, setPredictions] = useState([])
  const [alerts, setAlerts]           = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [lastFetch, setLastFetch]     = useState(null)
  const timerRef = useRef(null)

  const fetch = useCallback(() => {
    if (!stopId || !routeId) return
    setLoading(true)
    Promise.all([
      mbtaFetch(
        `/predictions?filter[stop]=${stopId}&filter[route]=${routeId}` +
        `&sort=arrival_time&include=trip&page[limit]=15`
      ),
      mbtaFetch(
        `/alerts?filter[stop]=${stopId}&filter[lifecycle]=NEW,ONGOING&page[limit]=5`
      ),
    ])
      .then(([pData, aData]) => {
        setPredictions(pData.data || [])
        setAlerts(aData.data || [])
        setLastFetch(new Date())
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [stopId, routeId])

  useEffect(() => {
    fetch()
    timerRef.current = setInterval(fetch, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [fetch, intervalMs])

  return { predictions, alerts, loading, error, lastFetch, refresh: fetch }
}

// ── useFavorites ──────────────────────────────────────────────────────────────
const FAV_KEY = 'dwell:favorites'

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites)

  const save = useCallback((next) => {
    setFavorites(next)
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const addFavorite = useCallback((entry) => {
    // entry: { mode, route, stop } — all plain objects with id + attributes
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
