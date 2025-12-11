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
      console.error('COINBASE_COMMERCE_WEBHOOK_SECRET missing')
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
      console.error('Supabase credentials missing')
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
        .select('id, credits_balance')
        .eq('email', email)
        .single()

      if (profile?.id) {
        const credits = Number(data?.metadata?.credits) || 0
        const plan = data?.metadata?.plan

        if (credits > 0) {
            // Credit purchase
            const current = Number(profile.credits_balance) || 0
            await supabase
                .from('user_profiles')
                .update({ credits_balance: current + credits })
                .eq('id', profile.id)
            
            // Notification
            try {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: profile.id,
                        title: 'Credits purchased (Crypto)',
                        body: `You purchased ${credits} credits via Coinbase. Code: ${data.code}`,
                        type: 'credit_purchase',
                        read: false
                    })
            } catch {}

        } else if (plan) {
            // Plan subscription
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            const { error: upErr } = await supabase
                .from('user_profiles')
                .update({ plan: plan, plan_expires_at: expiresAt })
                .eq('id', profile.id)
            
            if (upErr) {
                 // Retry without expires if column missing/error
                await supabase
                    .from('user_profiles')
                    .update({ plan: plan })
                    .eq('id', profile.id)
            }

             try {
                const base = process.env.API_ORIGIN || process.env.VITE_API_ORIGIN || 'https://preview.helloaca.xyz'
                await fetch(`${base}/api/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'plan_upgrade', userId: String(profile.id), email, extra: { plan: plan } })
                })
            } catch {}
        } else {
             // Fallback: legacy behavior (default to Pro if ambiguous)
             // Only if neither credits nor plan specified, but this shouldn't happen with new frontend
             // Safe to ignore or default to Pro? Let's default to Pro for backward compatibility if needed
             // But logging is safer.
             console.log('Coinbase charge confirmed but no credits/plan metadata found.', data.metadata)
        }
      }

      res.status(200).json({ received: true })
      return
    }

    res.status(200).json({ received: true })
  } catch (e) {
    console.error('Coinbase webhook handling error:', e)
    res.status(500).json({ error: 'Webhook handling error' })
  }
}
