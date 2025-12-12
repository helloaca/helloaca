import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'GET' && req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret || !supabaseUrl || !serviceRoleKey) { res.status(500).json({ error: 'Configuration error' }); return }

    const tx_ref = (req.method === 'GET' ? (req.query as any).tx_ref : (req.body as any).tx_ref) as string
    const email = (req.method === 'GET' ? (req.query as any).email : (req.body as any).email) as string
    if (!tx_ref) { res.status(400).json({ error: 'Missing tx_ref' }); return }

    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    })
    const verifyJson = await verifyRes.json().catch(() => null)
    if (!verifyRes.ok || verifyJson?.status !== 'success' || verifyJson?.data?.status !== 'successful') {
      res.status(400).json({ status: 'failed', message: verifyJson?.message || 'Verification failed', data: verifyJson?.data })
      return
    }

    const data = verifyJson.data
    const ref = String(data?.tx_ref || tx_ref)
    const creditsMatch = ref.match(/^CREDITS-(\d+)-/)
    const credits = creditsMatch ? parseInt(creditsMatch[1], 10) : 0
    const planMatch = ref.match(/^SUB-([A-Z]+)-(MONTHLY|YEARLY)-/)

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Find user by email for credit purchases
    const userEmail = email || data?.customer?.email
    let profile: any = null
    if (userEmail) {
      const { data: p } = await supabase.from('user_profiles').select('id,credits_balance,email,plan').eq('email', String(userEmail)).single()
      profile = p
    }

    if (credits && profile?.id) {
      const current = Number(profile.credits_balance) || 0
      const next = current + credits
      await supabase.from('user_profiles').update({ credits_balance: next }).eq('id', profile.id)
      try { await supabase.from('notifications').insert({ user_id: profile.id, title: 'Credits purchased', body: `You purchased ${credits} credits. Reference: ${ref}`, type: 'credit_purchase', read: false }) } catch {}
      res.status(200).json({ status: 'success', message: 'Credits added', new_balance: next })
      return
    }

    if (planMatch && profile?.id) {
      const plan = planMatch[1].toLowerCase() as 'pro'|'team'|'business'|'enterprise'
      await supabase.from('user_profiles').update({ plan }).eq('id', profile.id)
      try { await supabase.from('notifications').insert({ user_id: profile.id, title: 'Subscription activated', body: `Your ${plan} subscription is active. Reference: ${ref}`, type: 'system', read: false }) } catch {}
      res.status(200).json({ status: 'success', message: 'Subscription updated', plan })
      return
    }

    res.status(200).json({ status: 'success', message: 'Verified', data })
  } catch (e) {
    console.error('flutterwave-verify error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}

