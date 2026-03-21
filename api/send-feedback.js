// ── Vercel Serverless Function: Resend email proxy ────────────────────────────
// Route: POST /api/send-feedback
// Body: { type: string, message: string, version: string }
//
// Keeps RESEND_API_KEY on the server — never exposed to the browser.

const RESEND_API_KEY = process.env.RESEND_API_KEY   || ''
const FEEDBACK_TO    = process.env.FEEDBACK_TO_EMAIL  || ''
const FEEDBACK_FROM  = process.env.FEEDBACK_FROM_EMAIL || 'onboarding@resend.dev'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' })

  if (!RESEND_API_KEY) return res.status(503).json({ error: 'Email service not configured' })

  const { type, message, version } = req.body || {}
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' })

  try {
    const resend_res = await fetch('https://api.resend.com/emails', {
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

    if (!resend_res.ok) {
      const err = await resend_res.json().catch(() => ({}))
      return res.status(resend_res.status).json({ error: err.message || 'Resend error' })
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: 'Email send failed', detail: err.message })
  }
}
