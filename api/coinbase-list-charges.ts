import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY || process.env.VITE_COINBASE_COMMERCE_API_KEY
    if (!apiKey) { res.status(500).json({ error: 'Crypto payments not configured' }); return }
    const email = String((req.query as any).email || '').trim().toLowerCase()

    const ccRes = await fetch('https://api.commerce.coinbase.com/charges?limit=100', {
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
        'Accept': 'application/json'
      }
    })
    const ccJson = await ccRes.json().catch(() => null)
    if (!ccRes.ok || !ccJson || !Array.isArray(ccJson.data)) {
      res.status(400).json({ error: ccJson?.error?.message || 'Failed to list charges', data: ccJson?.data })
      return
    }
    const items = (ccJson.data as any[]).filter((c: any) => {
      const mEmail = String(c?.metadata?.email || '').trim().toLowerCase()
      return email ? mEmail === email : true
    }).map((c: any) => {
      const timeline = Array.isArray(c?.timeline) ? c.timeline : []
      const last = timeline.length > 0 ? timeline[timeline.length - 1] : null
      const status = String(c?.status || last?.status || '').toLowerCase()
      const local = (c?.pricing?.local || {}) as any
      const amountStr = String(local?.amount || '')
      const amountNum = amountStr && !isNaN(Number(amountStr)) ? Number(amountStr) : null
      return {
        reference: String(c?.code || c?.id || ''),
        status,
        amount: amountNum,
        currency: String(local?.currency || 'USD').toUpperCase(),
        created_at: String(c?.created_at || ''),
        hosted_url: String(c?.hosted_url || ''),
        explorer_url: null
      }
    })
    res.status(200).json({ data: items })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
