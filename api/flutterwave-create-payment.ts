import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const { userId, email, amount_usd, credits, plan, period, tx_ref } = req.body as any
    if (!email || !amount_usd) { res.status(400).json({ error: 'Missing email or amount' }); return }

    const secret = process.env.FLUTTERWAVE_SECRET_KEY
    const pub = process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.VITE_FLUTTERWAVE_PUBLIC_KEY
    if (!secret || !pub) { res.status(500).json({ error: 'Flutterwave not configured' }); return }
    const env = String(process.env.VERCEL_ENV || process.env.NODE_ENV || '').toLowerCase()
    const isProd = env === 'production'
    const usesTestKeys = secret.startsWith('FLWSECK_TEST') || pub.startsWith('FLWPUBK_TEST')
    if (isProd && usesTestKeys) { res.status(500).json({ error: 'Flutterwave test keys detected in production' }); return }

    const reference = tx_ref || (credits ? `CREDITS-${credits}-${Date.now()}` : plan ? `SUB-${String(plan).toUpperCase()}-${String(period||'monthly').toUpperCase()}-${Date.now()}` : `TX-${Date.now()}`)
    const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://helloaca.xyz')
    const redirect_url = `${base}/api/flutterwave-verify?tx_ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`

    const preferredCurrency = (process.env.FLUTTERWAVE_DEFAULT_CURRENCY || 'USD').toUpperCase()
    const preferredCountry = (process.env.FLUTTERWAVE_DEFAULT_COUNTRY || '').toUpperCase()
    const usdAmount = Number(amount_usd)
    const fxRateNgn = Number(process.env.FLUTTERWAVE_USD_TO_NGN_RATE || process.env.FX_USD_TO_NGN || 1600)
    const finalAmount = preferredCurrency === 'NGN' ? Math.round(usdAmount * fxRateNgn) : usdAmount
    const payload = {
      tx_ref: reference,
      amount: finalAmount,
      currency: preferredCurrency,
      redirect_url,
      payment_options: 'card,applepay,googlepay',
      public_key: pub,
      // Avoid enforcing country to let checkout pick correct auth model for card BIN
      customer: { email },
      meta: { userId, credits, plan, period },
      customizations: {
        title: 'Helloaca',
        description: credits ? `${credits} credits` : (plan ? `${String(plan)} subscription` : 'Payment'),
        logo: `${base}/logo.png`
      }
    }

    const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload)
    })
    const data = await fwRes.json().catch(() => null)
    if (!fwRes.ok || !data?.status || data.status !== 'success') {
      res.status(400).json({ error: data?.message || 'Failed to initialize payment', data })
      return
    }
    const link = data?.data?.link
    if (!link) { res.status(400).json({ error: 'Payment link not provided', data }); return }
    res.status(200).json({ link, tx_ref: reference })
  } catch (e) {
    console.error('flutterwave-create-payment error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}
