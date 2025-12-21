import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CC-Webhook-Signature')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET
    if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
      res.status(500).json({ error: 'Server configuration error' })
      return
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const signature = String(req.headers['x-cc-webhook-signature'] || '')
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    const computed = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex')
    const env = String(process.env.VERCEL_ENV || process.env.NODE_ENV || '').toLowerCase()
    const isDev = env !== 'production'
    if (!signature || signature !== computed) {
      if (!isDev) {
        res.status(401).json({ error: 'Invalid signature' })
        return
      }
    }

    const payload: any = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body
    const eventType = String(payload?.event?.type || payload?.type || '')
    const data = payload?.event?.data || payload?.data || {}
    const metadata = data?.metadata || {}
    const credits = Number(metadata?.credits || 0)
    const userId = String(metadata?.userId || '')
    const email = String(metadata?.email || '')

    if (!eventType) { res.status(400).json({ error: 'Missing event type' }); return }
    if (eventType !== 'charge:confirmed') {
      res.status(200).json({ status: 'ignored', event: eventType })
      return
    }
    if (!userId || !credits) { res.status(400).json({ error: 'Missing userId or credits in metadata' }); return }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id,credits_balance,email')
      .eq('id', userId)
      .single()
    if (!profile?.id) { res.status(404).json({ error: 'User profile not found' }); return }

    const current = Number(profile.credits_balance) || 0
    const next = current + credits
    await supabase.from('user_profiles').update({ credits_balance: next }).eq('id', profile.id)
    try {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Credits purchased',
        body: `You purchased ${credits} credits via crypto.`,
        type: 'credit_purchase',
        read: false
      })
    } catch {}

    try {
      const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || 'https://helloaca.xyz'
      await fetch(`${base}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'credit_purchase', userId: profile.id, extra: { credits, reference: data?.code || data?.id || '' }, sendOnly: true })
      })
    } catch {}

    res.status(200).json({ status: 'success', new_balance: next })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
