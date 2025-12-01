import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(200).end()
    return
  }
  const isGet = req.method === 'GET'
  const isPost = req.method === 'POST'
  if (!isGet && !isPost) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { reference } = isGet 
      ? ({ reference: (req.query?.reference as string | undefined) })
      : (req.body as { reference?: string })
    if (!reference) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Missing reference' })
      return
    }

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Payment not configured' })
      return
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secret}`
      }
    })

    const verifyJson = await verifyRes.json()

    if (verifyRes.ok && verifyJson?.data?.status === 'success') {
      const data = verifyJson.data
      const email = (data?.customer?.email as string) || ''
      const creditsMeta = (data?.metadata?.credits as number) || 0
      let credits = Number.isFinite(creditsMeta) ? Math.floor(creditsMeta) : 0
      if (!credits && typeof data?.reference === 'string') {
        const m = String(data.reference).match(/^CREDITS-(\d+)-/)
        if (m) credits = parseInt(m[1], 10)
      }

      try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && serviceRoleKey && email && credits > 0) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(supabaseUrl, serviceRoleKey)
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, credits_balance')
            .eq('email', email)
            .single()
          if (profile?.id) {
            const current = typeof profile.credits_balance === 'number' ? profile.credits_balance : 0
            await supabase
              .from('user_profiles')
              .update({ credits_balance: current + credits })
              .eq('id', profile.id)
          }
        }
      } catch (e) {
        // Swallow DB errors to not block verification response
      }

      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(200).json({ status: 'success', data: verifyJson.data })
      return
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(400).json({ status: 'failed', data: verifyJson?.data, message: verifyJson?.message })
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Verification error' })
  }
}