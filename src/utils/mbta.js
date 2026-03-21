// ── MBTA API client ───────────────────────────────────────────────────────────
// In production (Vercel), all requests are routed through /api/mbta so the
// API key stays on the server and is never sent to the browser.
// In local dev (Vite), VITE_MBTA_API_KEY is used directly for speed.
// To test the serverless function locally: run `vercel dev` instead of `npm run dev`.

const IS_DEV  = import.meta.env.DEV
const DEV_KEY = import.meta.env.VITE_MBTA_API_KEY || ''
const MBTA_BASE = 'https://api-v3.mbta.com'

export async function mbtaFetch(path) {
  if (IS_DEV && DEV_KEY) {
    // Local dev: call MBTA directly with key from .env
    const sep = path.includes('?') ? '&' : '?'
    const url = `${MBTA_BASE}${path}${sep}api_key=${DEV_KEY}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`MBTA ${res.status} — ${res.statusText}`)
    return res.json()
  }

  // Production: proxy through Vercel serverless function (key stays server-side)
  const url = `/api/mbta?path=${encodeURIComponent(path)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Proxy ${res.status}`)
  }
  return res.json()
}

// ── Transit Modes ─────────────────────────────────────────────────────────────
export const MODES = [
  { id: 'subway',   label: 'Subway',        shortLabel: 'SWY', routeTypes: '0,1', icon: '⬡', description: 'Red, Orange, Blue, Green, Silver lines' },
  { id: 'commuter', label: 'Commuter Rail',  shortLabel: 'CRL', routeTypes: '2',   icon: '◈', description: 'Regional rail to suburbs & Providence'   },
  { id: 'bus',      label: 'Bus',            shortLabel: 'BUS', routeTypes: '3',   icon: '◎', description: 'Local & express bus routes'              },
]

// ── Line accent colors ────────────────────────────────────────────────────────
export const LINE_COLORS = {
  Red:       { accent: '#E8302A', dim: '#7A1B17' },
  Orange:    { accent: '#F07800', dim: '#7A3D00' },
  Blue:      { accent: '#3B82F6', dim: '#1E3A5F' },
  Green:     { accent: '#22C55E', dim: '#14532D' },
  'Green-B': { accent: '#22C55E', dim: '#14532D' },
  'Green-C': { accent: '#22C55E', dim: '#14532D' },
  'Green-D': { accent: '#22C55E', dim: '#14532D' },
  'Green-E': { accent: '#22C55E', dim: '#14532D' },
  Silver:    { accent: '#94A3B8', dim: '#334155' },
  CR:        { accent: '#A855F7', dim: '#4C1D95' },
  Bus:       { accent: '#E8C547', dim: '#7A6820' },
}

export function getLineColor(routeId = '') {
  if (routeId.startsWith('Green')) return LINE_COLORS['Green']
  if (routeId.startsWith('CR-'))   return LINE_COLORS['CR']
  return LINE_COLORS[routeId] || LINE_COLORS['Bus']
}

// ── Countdown formatter ───────────────────────────────────────────────────────
export function formatCountdown(isoTime) {
  if (!isoTime) return { label: '—', tier: 'unknown', seconds: null }
  const diff = Math.floor((new Date(isoTime) - Date.now()) / 1000)
  if (diff < -90)  return { label: 'DEPARTED',  tier: 'gone',     seconds: diff }
  if (diff < 0)    return { label: 'DEPARTING', tier: 'boarding', seconds: diff }
  if (diff === 0)  return { label: 'NOW',        tier: 'boarding', seconds: diff }
  if (diff <= 60)  return { label: `${diff}s`,   tier: 'now',      seconds: diff }
  const m = Math.floor(diff / 60)
  const s = String(diff % 60).padStart(2, '0')
  if (m < 60) return { label: `${m}:${s}`, tier: m <= 3 ? 'soon' : 'ok', seconds: diff }
  return { label: `${Math.floor(m / 60)}h ${m % 60}m`, tier: 'far', seconds: diff }
}

// Countdown colors use CSS variables so they are correct in both light and dark mode.
// boarding/now/soon are vivid enough to work on any background.
// ok/far/gone reference theme variables so light mode text stays readable.
export const COUNTDOWN_COLORS = {
  boarding: '#F05555',
  now:      '#F09040',
  soon:     '#F2CA45',
  ok:       'var(--text)',          // full text color — always readable
  far:      'var(--text-muted)',    // muted but readable in both modes
  gone:     'var(--text-dim)',      // dim — departed trains
  unknown:  'var(--text-dim)',
}
