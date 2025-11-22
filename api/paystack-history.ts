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
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!email) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Missing email' })
      return
    }
    if (!secret) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Paystack not configured' })
      return
    }

    const txRes = await fetch('https://api.paystack.co/transaction?perPage=50&page=1', {
      headers: { Authorization: `Bearer ${secret}` }
    })
    const txJson = await txRes.json()
    const data = Array.isArray(txJson?.data) ? txJson.data.filter((t: any) => {
      const cEmail = t?.customer?.email || t?.authorization?.email
      return cEmail && String(cEmail).toLowerCase() === email.toLowerCase()
    }).map((t: any) => ({
      reference: t?.reference,
      status: t?.status,
      amount: t?.amount,
      created_at: t?.paid_at || t?.created_at
    })) : []

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({ data })
  } catch (e: any) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: e?.message || 'History error' })
  }
}