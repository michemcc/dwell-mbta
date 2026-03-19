// ── MBTA API v3 ───────────────────────────────────────────────────────────────
// Replace with your key from https://api-v3.mbta.com/
export const MBTA_API_KEY = import.meta.env.VITE_MBTA_API_KEY || 'YOUR_MBTA_API_KEY_HERE'
const BASE = 'https://api-v3.mbta.com'

export async function mbtaFetch(path) {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${BASE}${path}${sep}api_key=${MBTA_API_KEY}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`MBTA ${res.status} — ${res.statusText}`)
  return res.json()
}

// ── Transit Modes ─────────────────────────────────────────────────────────────
export const MODES = [
  {
    id: 'subway',
    label: 'Subway',
    shortLabel: 'SWY',
    routeTypes: '0,1',
    icon: '⬡',
    description: 'Red, Orange, Blue, Green, Silver lines',
  },
  {
    id: 'commuter',
    label: 'Commuter Rail',
    shortLabel: 'CRL',
    routeTypes: '2',
    icon: '◈',
    description: 'Regional rail to suburbs & Providence',
  },
  {
    id: 'bus',
    label: 'Bus',
    shortLabel: 'BUS',
    routeTypes: '3',
    icon: '◎',
    description: 'Local & express bus routes',
  },
]

// ── Line accent colors ────────────────────────────────────────────────────────
export const LINE_COLORS = {
  Red:     { accent: '#E8302A', dim: '#7A1B17' },
  Orange:  { accent: '#F07800', dim: '#7A3D00' },
  Blue:    { accent: '#3B82F6', dim: '#1E3A5F' },
  Green:   { accent: '#22C55E', dim: '#14532D' },
  'Green-B': { accent: '#22C55E', dim: '#14532D' },
  'Green-C': { accent: '#22C55E', dim: '#14532D' },
  'Green-D': { accent: '#22C55E', dim: '#14532D' },
  'Green-E': { accent: '#22C55E', dim: '#14532D' },
  Silver:  { accent: '#94A3B8', dim: '#334155' },
  CR:      { accent: '#A855F7', dim: '#4C1D95' },
  Bus:     { accent: '#E8C547', dim: '#7A6820' },
}

export function getLineColor(routeId = '') {
  if (routeId.startsWith('Green')) return LINE_COLORS['Green']
  return LINE_COLORS[routeId] || LINE_COLORS['Bus']
}

// ── Countdown formatter ───────────────────────────────────────────────────────
export function formatCountdown(isoTime) {
  if (!isoTime) return { label: '—', tier: 'unknown', seconds: null }
  const diff = Math.floor((new Date(isoTime) - Date.now()) / 1000)
  if (diff < -60)   return { label: 'DEPARTED', tier: 'gone',     seconds: diff }
  if (diff <= 0)    return { label: 'BRD',       tier: 'boarding', seconds: diff }
  if (diff <= 60)   return { label: `${diff}s`,  tier: 'now',      seconds: diff }
  const m = Math.floor(diff / 60)
  const s = String(diff % 60).padStart(2, '0')
  if (m < 60) return { label: `${m}:${s}`, tier: m <= 3 ? 'soon' : 'ok', seconds: diff }
  return { label: `${Math.floor(m / 60)}h ${m % 60}m`, tier: 'far', seconds: diff }
}

export const COUNTDOWN_COLORS = {
  boarding: '#E8504A',
  now:      '#E8843A',
  soon:     '#E8C547',
  ok:       '#DFE0E3',
  far:      '#7A7F8E',
  gone:     '#3D4150',
  unknown:  '#3D4150',
}
