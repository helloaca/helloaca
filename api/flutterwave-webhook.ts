import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, verif-hash')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const hash = req.headers['verif-hash'] as string | undefined
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLW_WEBHOOK_SECRET
    if (!secretHash || !hash || hash !== secretHash) { res.status(401).json({ error: 'Invalid webhook hash' }); return }

    const payload = req.body as any
    const eventData = payload?.data
    if (!eventData) { res.status(400).json({ error: 'Invalid payload' }); return }

    if (String(eventData?.status).toLowerCase() !== 'successful') {
      res.status(200).json({ status: 'ignored' })
      return
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) { res.status(500).json({ error: 'Database configuration error' }); return }
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const email = eventData?.customer?.email
    const tx_ref = String(eventData?.tx_ref || '')
    const creditsMatch = tx_ref.match(/^CREDITS-(\d+)-/)
    const credits = creditsMatch ? parseInt(creditsMatch[1], 10) : 0

    const { data: profile } = await supabase.from('user_profiles').select('id,credits_balance,email').eq('email', String(email)).single()

    if (credits && profile?.id) {
      const current = Number(profile.credits_balance) || 0
      const next = current + credits
      await supabase.from('user_profiles').update({ credits_balance: next }).eq('id', profile.id)
      try { await supabase.from('notifications').insert({ user_id: profile.id, title: 'Credits purchased', body: `You purchased ${credits} credits. Reference: ${tx_ref}`, type: 'credit_purchase', read: false }) } catch {}
      res.status(200).json({ status: 'success' })
      return
    }

    res.status(200).json({ status: 'processed' })
  } catch (e) {
    console.error('flutterwave-webhook error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}

