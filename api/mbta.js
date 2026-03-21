// ── Vercel Serverless Function: MBTA API proxy ────────────────────────────────
// Route: GET /api/mbta?path=/stops?filter[route]=Red
//
// Keeps MBTA_API_KEY on the server — never sent to the browser.
// The frontend calls this proxy instead of api-v3.mbta.com directly.

const MBTA_BASE    = 'https://api-v3.mbta.com'
const MBTA_API_KEY = process.env.MBTA_API_KEY || ''

export default async function handler(req, res) {
  // CORS — allow same-origin requests from the deployed frontend
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method Not Allowed' })

  const rawPath = req.query.path
  if (!rawPath) return res.status(400).json({ error: 'Missing path parameter' })

  const sep      = rawPath.includes('?') ? '&' : '?'
  const upstream = `${MBTA_BASE}${rawPath}${sep}api_key=${MBTA_API_KEY}`

  try {
    const upstream_res = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    const body = await upstream_res.text()
    res.status(upstream_res.status)
      .setHeader('Content-Type', 'application/json')
      .send(body)
  } catch (err) {
    res.status(502).json({ error: 'Upstream MBTA request failed', detail: err.message })
  }
}
