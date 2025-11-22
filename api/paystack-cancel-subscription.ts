import type { VercelRequest, VercelResponse } from '@vercel/node'

async function getJson(url: string, secret: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
  const j = await r.json()
  if (!r.ok) throw new Error(j?.message || 'Paystack request failed')
  return j
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(200).end()
    return
  }
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) { res.setHeader('Access-Control-Allow-Origin', '*'); return res.status(500).json({ error: 'Paystack not configured' }) }

    const { email, subscription_code, email_token } = (req.method === 'GET' ? req.query : req.body) as {
      email?: string
      subscription_code?: string
      email_token?: string
    }
    if (!email && !subscription_code) { res.setHeader('Access-Control-Allow-Origin', '*'); return res.status(400).json({ error: 'Missing email or subscription code' }) }

    let code = subscription_code
    let token = email_token

    if (!code || !token) {
      // Try to resolve via customer -> subscriptions
      const customers = await getJson('https://api.paystack.co/customer?perPage=50&page=1', secret)
      const customer = (Array.isArray(customers?.data) ? customers.data : []).find((c: any) => c?.email === email)
      if (!customer && !code) { res.setHeader('Access-Control-Allow-Origin', '*'); return res.status(404).json({ error: 'Customer not found' }) }

      const subs = await getJson('https://api.paystack.co/subscription?perPage=50&page=1', secret)
      const match = (Array.isArray(subs?.data) ? subs.data : []).find((s: any) => {
        if (code && s?.subscription_code === code) return true
        return s?.customer === customer?.customer_code && s?.status?.toLowerCase() === 'active'
      })
      if (!match) { res.setHeader('Access-Control-Allow-Origin', '*'); return res.status(404).json({ error: 'Active subscription not found' }) }
      code = match?.subscription_code
      token = match?.email_token
    }

    // Disable subscription
    const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, token })
    })
    const disableJson = await disableRes.json()
    if (!disableRes.ok) { res.setHeader('Access-Control-Allow-Origin', '*'); return res.status(disableRes.status).json(disableJson) }

    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({ status: 'ok', data: disableJson?.data || null })
  } catch (e: any) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(500).json({ error: e?.message || 'Cancellation error' })
  }
}