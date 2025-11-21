import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY
    if (!apiKey) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Crypto payment not configured' })
      return
    }

    const { userId, email } = req.body as { userId?: string; email?: string }
    if (!userId || !email) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Missing user data' })
      return
    }

    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://helloaca.xyz'

    const chargeRes = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CC-Api-Key': apiKey
      },
      body: JSON.stringify({
        name: 'HelloACA Pro',
        description: 'Monthly subscription',
        pricing_type: 'fixed_price',
        local_price: { amount: '3.00', currency: 'USD' },
        metadata: { userId, email, plan: 'pro' },
        redirect_url: `${appUrl}/pricing?crypto=success`,
        cancel_url: `${appUrl}/pricing?crypto=canceled`
      })
    })

    const json = await chargeRes.json()
    if (chargeRes.ok && json?.data?.hosted_url) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(200).json({ hosted_url: json.data.hosted_url, id: json.data.id })
      return
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(400).json({ error: 'Charge creation failed', details: json })
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Charge creation error' })
  }
}