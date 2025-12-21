import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY
    if (!secret) { res.status(500).json({ error: 'Flutterwave not configured' }); return }

    const email = String((req.query as any).email || '').trim().toLowerCase()
    const now = new Date()
    const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    const from = past.toISOString().slice(0, 10)
    const to = now.toISOString().slice(0, 10)

    const url = `https://api.flutterwave.com/v3/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    const fwRes = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` }
    })
    const fwJson = await fwRes.json().catch(() => null)
    if (!fwRes.ok || !fwJson || !Array.isArray(fwJson.data)) {
      res.status(400).json({ error: fwJson?.message || 'Failed to fetch transactions', data: fwJson?.data })
      return
    }

    const fxNgn = Number(process.env.FLUTTERWAVE_USD_TO_NGN_RATE || process.env.FX_USD_TO_NGN || 1600)
    const mapped = (fwJson.data as any[])
      .filter((tx: any) => {
        const txEmail = String(tx?.customer_email || tx?.customer?.email || '').trim().toLowerCase()
        return email ? txEmail === email : true
      })
      .map((tx: any) => {
        const currency = String(tx?.currency || 'USD').toUpperCase()
        const amt = Number(tx?.amount || 0)
        const amountUsd = currency === 'USD'
          ? Math.max(0, amt)
          : (fxNgn > 0 ? Math.max(0, Math.round((amt / fxNgn) * 100) / 100) : 0)
        return {
          reference: String(tx?.tx_ref || tx?.flw_ref || tx?.id || ''),
          status: String(tx?.status || '').toLowerCase(),
          amount: amountUsd,
          currency: 'USD',
          created_at: String(tx?.created_at || ''),
          paid_at: String(tx?.created_at || ''),
          method: String(tx?.payment_type || 'card').toLowerCase(),
          explorer_url: null
        }
      })

    res.status(200).json({ data: mapped })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
