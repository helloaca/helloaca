import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const { userId, email, amount_usd, credits } = (req.body || {}) as { userId?: string; email?: string; amount_usd?: number | string; credits?: number }
    if (!email || !amount_usd || !credits) {
      res.status(400).json({ error: 'Missing email, amount, or credits' })
      return
    }
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY || process.env.VITE_COINBASE_COMMERCE_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: 'Crypto payments not configured' })
      return
    }

    const env = String(process.env.VERCEL_ENV || process.env.NODE_ENV || '').toLowerCase()
    const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://helloaca.xyz')
    const usdAmount = Number(amount_usd)
    if (!isFinite(usdAmount) || usdAmount <= 0) {
      res.status(400).json({ error: 'Invalid amount' })
      return
    }

    const payload = {
      name: 'Helloaca Credits',
      description: `${credits} credit${credits > 1 ? 's' : ''} purchase`,
      pricing_type: 'fixed_price',
      local_price: { amount: usdAmount.toFixed(2), currency: 'USD' },
      redirect_url: `${base}/dashboard`,
      cancel_url: `${base}/pricing`,
      metadata: { userId, email, credits, env }
    }

    const fwRes = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const data = await fwRes.json().catch(() => null)
    if (!fwRes.ok || !data?.data?.hosted_url) {
      res.status(400).json({ error: data?.error?.message || 'Failed to create crypto charge', data })
      return
    }
    const url = data.data.hosted_url
    res.status(200).json({ hosted_url: url, code: data.data.code })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
