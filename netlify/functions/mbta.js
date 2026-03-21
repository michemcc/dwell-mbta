// ── Netlify Function: MBTA API proxy ─────────────────────────────────────────
// Route: /.netlify/functions/mbta?path=/stops?filter[route]=Red
//
// Keeps MBTA_API_KEY on the server — it is never sent to the browser.
// The frontend calls this proxy instead of api-v3.mbta.com directly.

const MBTA_BASE    = 'https://api-v3.mbta.com'
const MBTA_API_KEY = process.env.MBTA_API_KEY || ''

export const handler = async (event) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // The frontend sends the MBTA path + query string as a `path` query param
  // e.g. /.netlify/functions/mbta?path=%2Fstops%3Ffilter%5Broute%5D%3DRed
  const rawPath = event.queryStringParameters?.path
  if (!rawPath) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing path parameter' }) }
  }

  // Build the upstream URL, appending the API key server-side
  const sep = rawPath.includes('?') ? '&' : '?'
  const upstream = `${MBTA_BASE}${rawPath}${sep}api_key=${MBTA_API_KEY}`

  try {
    const res  = await fetch(upstream, { headers: { Accept: 'application/json' } })
    const body = await res.text()
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        // Allow the Netlify site's own origin only
        'Access-Control-Allow-Origin': process.env.SITE_URL || '*',
      },
      body,
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Upstream MBTA request failed', detail: err.message }),
    }
  }
}
