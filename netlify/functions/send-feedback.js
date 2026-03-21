// ── Netlify Function: Resend email proxy ─────────────────────────────────────
// Route: POST /.netlify/functions/send-feedback
// Body: { type: string, message: string, version: string }
//
// Keeps RESEND_API_KEY on the server — never exposed to the browser.

const RESEND_API_KEY  = process.env.RESEND_API_KEY  || ''
const FEEDBACK_TO     = process.env.FEEDBACK_TO_EMAIL  || ''
const FEEDBACK_FROM   = process.env.FEEDBACK_FROM_EMAIL || 'onboarding@resend.dev'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!RESEND_API_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Email service not configured' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const { type, message, version } = body
  if (!message?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    `DWELL Feedback <${FEEDBACK_FROM}>`,
        to:      [FEEDBACK_TO],
        subject: `DWELL Feedback — ${type || 'General'}`,
        text:    `${message}\n\n---\nDWELL ${version || ''}`,
        html:    `<p style="font-family:sans-serif">${message.replace(/\n/g, '<br>')}</p><hr><p style="color:#888;font-size:12px">DWELL ${version || ''}</p>`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { statusCode: res.status, body: JSON.stringify({ error: err.message || 'Resend error' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': process.env.SITE_URL || '*' },
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Email send failed', detail: err.message }),
    }
  }
}
