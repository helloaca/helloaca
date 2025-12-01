import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET
    if (!secret) {
      res.status(500).json({ error: 'Webhook not configured' })
      return
    }

    const signature = req.headers['x-cc-webhook-signature'] as string | undefined
    if (!signature) {
      res.status(400).json({ error: 'Missing signature' })
      return
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (expected !== signature) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const type = (req.body as any)?.event?.type || (req.body as any)?.type
    const data = (req.body as any)?.event?.data || (req.body as any)?.data

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      res.status(500).json({ error: 'Database not configured' })
      return
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const email = (data?.metadata?.email as string) || (data?.metadata?.customer_email as string) || ''
    if (!email) {
      res.status(200).json({ received: true })
      return
    }

    if (type === 'charge:confirmed' || type === 'charge:resolved') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile?.id) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const { error: upErr } = await supabase
          .from('user_profiles')
          .update({ plan: 'pro', plan_expires_at: expiresAt })
          .eq('id', profile.id)
        if (upErr) {
          await supabase
            .from('user_profiles')
            .update({ plan: 'pro' })
            .eq('id', profile.id)
        }

        const creditsMeta = (data?.metadata?.credits as number) || 0
        const credits = Number.isFinite(creditsMeta) ? Math.floor(creditsMeta) : 0
        if (credits > 0) {
          const { data: existing } = await supabase
            .from('user_profiles')
            .select('credits_balance')
            .eq('id', profile.id)
            .single()
          const current = typeof existing?.credits_balance === 'number' ? existing.credits_balance : 0
          await supabase
            .from('user_profiles')
            .update({ credits_balance: current + credits })
            .eq('id', profile.id)
        }
      }

      res.status(200).json({ received: true })
      return
    }

    res.status(200).json({ received: true })
  } catch (e) {
    res.status(500).json({ error: 'Webhook handling error' })
  }
}