import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const email = (req.query?.email || req.body?.email) as string | undefined
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      res.status(500).json({ error: 'Paystack not configured' })
      return
    }
    const url = 'https://api.paystack.co/transaction'
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` }
    })
    const j = await r.json()
    const data = Array.isArray(j?.data) ? j.data : []
    const filtered = email ? data.filter((tx: any) => tx?.customer?.email === email) : data
    res.status(200).json({ data: filtered.slice(0, 20) })
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}