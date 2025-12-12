import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(200).end()
    return
  }
  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const email = String((req.query as any)?.email || '')
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY
    if (!email) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Missing email' })
      return
    }
    if (!apiKey) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Coinbase not configured' })
      return
    }

    const chargesRes = await fetch('https://api.commerce.coinbase.com/charges?limit=50', {
      headers: {
        'X-CC-Api-Key': apiKey,
        'X-CC-Api-Version': '2018-03-22',
        'Content-Type': 'application/json'
      }
    })
    const chargesJson = await chargesRes.json()
    const data = Array.isArray(chargesJson?.data) ? chargesJson.data.filter((c: any) => {
      const metaEmail = c?.metadata?.email || c?.metadata?.customer_email
      return metaEmail && String(metaEmail).toLowerCase() === email.toLowerCase()
    }).map((c: any) => ({
      reference: c?.code || c?.id,
      status: c?.status || (Array.isArray(c?.timeline) ? c.timeline[c.timeline.length - 1]?.status : undefined),
      amount: c?.pricing?.local?.amount,
      currency: c?.pricing?.local?.currency,
      created_at: c?.created_at,
      hosted_url: c?.hosted_url,
      explorer_url: Array.isArray(c?.payments) && c.payments[0]?.block?.explorer_url ? c.payments[0].block.explorer_url : null
    })) : []

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({ data })
  } catch (e: any) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: e?.message || 'Coinbase charges error' })
  }
}